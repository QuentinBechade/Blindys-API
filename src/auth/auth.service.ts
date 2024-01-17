import {Injectable, NotFoundException, UnauthorizedException,} from '@nestjs/common';
import {PrismaService} from '../prisma/prisma.service';
import {verifyPassword} from '../utils/auth';
import {AuthEntity} from './entities/auth.entity';
import {UserService} from '../user/user.service';
import {decodeToken, generateAccessToken, generateRefreshToken, isValidateToken,} from '../utils/token';
import {RegisterDto} from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * @description Connecter un utilisateur
   * @param email
   * @param password
   * @returns {Promise<AuthEntity>}
   */
  async login(email: string, password: string): Promise<AuthEntity> {
    // Récupérer l'utilisateur avec l'email ou le nom d'utilisateur
    const user = await this.userService.findOneByEmail(email);

    // lève une erreur si l'utilisateur n'est pas trouvé
    if (!user) {
      throw new NotFoundException('Aucun utilisateur trouvé avec cet email.');
    }

    // Vérifier si l'utilisateur est actuellement bloqué
    const lockoutUntil = await this.getLockoutUntil(email);
    if (lockoutUntil && lockoutUntil > Date.now()) {
      const timeLeft = Math.ceil((lockoutUntil - Date.now()) / 1000); // Convertir en secondes
      throw new UnauthorizedException(
        `Too many login attempts. Please try again in ${timeLeft} seconds.`,
      );
    }

    // Verifier si le mot de passe est valide
    const isPasswordValid = await verifyPassword(user.password, password);

    // Si le mot de passe n'est pas valide, gérer la logique de verrouillage
    if (!isPasswordValid) {
      await this.handleFailedLogin(email);
      throw new UnauthorizedException(
        "L'email ou le mot de passe est incorrect",
      );
    }

    // Vérifier si un jeton de rafraîchissement existe déjà pour l'utilisateur
    // Si ce n'est pas le cas, en générer un et le sauvegarder dans la base de données
    const refreshTokenExists = await this.prisma.refreshToken.findFirst({
      where: {
        userId: user.id,
      },
    });
    if (!refreshTokenExists) {
      const refreshToken: string = await generateRefreshToken(user.id);
      // Enregistrer le jeton de rafraîchissement dans la base de données
      await this.prisma.refreshToken.create({
        data: {
          token: refreshToken,
          userId: user.id,
        },
      });
    }

    const accessToken: string = await generateAccessToken(user.id);

    // Si l'utilisateur est actuellement verrouillé, réinitialiser le nombre de tentatives échouées
    await this.resetFailedLoginAttempts(email);


    return {
      id: user.id,
      userName: user.firstName + ' ' + user.lastName,
      accessToken,
    };
  }

  /**
   * @description Créer un utilisateur
   * @param registerDto
   */
  async register(registerDto: RegisterDto) {
    // Verifier si le mot de passe et la confirmation du mot de passe correspondent
    if (registerDto.password !== registerDto.confirmPassword) {
      throw new UnauthorizedException(
        'Le mot de passe et la confirmation du mot de passe ne correspondent pas',
      );
    }
    // Verifier si l'utilisateur existe déjà
    const userExists = await this.userService.findOneByEmail(registerDto.email);
    if (userExists && Object.keys(userExists).length) {
      throw new UnauthorizedException(
        'Un utilisateur avec cet email existe déjà',
      );
    }
    delete registerDto.confirmPassword;
    return await this.userService.create(registerDto);
  }

  /**
   * @description Déconnecter un utilisateur
   * @param userId
   */
  async logout(userId: string) {
    const logout = await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
      },
    });
    if (!logout) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return logout;
  }

  /**
   * Traite de manière asynchrone une tentative de connexion échouée pour une adresse e-mail donnée.
   *
   * Cette méthode vérifie le nombre de tentatives de connexion échouées pour l'adresse électronique fournie.
   * Si les tentatives dépassent le nombre maximum de tentatives autorisées moins une, elle initie un verrouillage
   * en réinitialisant le nombre de tentatives échouées et en définissant une durée de verrouillage.
   * Sinon, elle incrémente le nombre de tentatives de connexion échouées.
   *
   * @param {string} email - L'adresse électronique associée à la tentative de connexion échouée.
   */
  async handleFailedLogin(email: string): Promise<void> {
    // Retrieve the current number of failed login attempts for the email
    const attempts = await this.getFailedLoginAttempts(email);

    // Define the maximum allowed failed login attempts
    const maxAttempts = 7;

    // Check if the next attempt will exceed the maximum allowed attempts
    if (attempts >= maxAttempts - 1) {
      // If the next attempt will exceed the maximum attempts, handle lockout
      await this.resetFailedLoginAttempts(email);

      // Set the lockout duration to 10 minutes from the current time
      const lockoutUntil = Date.now() + 15 * 60 * 1000; // 10 minutes in milliseconds
      await this.setLockoutUntil(email, lockoutUntil);
    } else {
      // Increment the failed login attempts count
      await this.incrementFailedLoginAttempts(email);
    }
  }

  /**
   * Actualise de manière asynchrone un jeton d'accès en utilisant le jeton d'accès fourni.
   *
   * Cette méthode décode le jeton d'accès fourni pour en extraire les informations relatives à l'utilisateur,
   * vérifie si un jeton de rafraîchissement correspondant existe pour l'utilisateur, et renvoie
   * un nouveau jeton d'accès en cas de rafraîchissement réussi.
   *
   * @param {string} accessToken - Le jeton d'accès à rafraîchir.
   * @returns {Promise<{ accessToken : string }>} Une promesse qui se résout avec le jeton d'accès actualisé.
   */
  async refreshAccessToken(
    accessToken: string,
  ): Promise<{ accessToken: string }> {
    // Decode the provided access token to extract user information
    const data = decodeToken(accessToken);

    // Check if a corresponding refresh token exists for the user
    const refreshTokenExists = await this.prisma.refreshToken.findFirst({
      where: {
        userId: data.userId,
      },
    });

    // Throw error if refresh token does not exist
    if (!refreshTokenExists) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Check if refresh token is valid and not expired
    const isRefreshTokenValid = isValidateToken(refreshTokenExists.token);
    if (!isRefreshTokenValid) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Generate a new access token and return it
    const newAccessToken = await generateAccessToken(data.userId);
    return { accessToken: newAccessToken };
  }

  /**
   * Incrémente de manière asynchrone le nombre de tentatives de connexion échouées pour une adresse e-mail donnée.
   *
   * Cette méthode vérifie si une entrée existe déjà pour l'utilisateur dans le modèle FailedLoginAttempts.
   * Si c'est le cas, elle met à jour l'entrée existante avec le nombre incrémenté de tentatives de connexion infructueuses.
   * Si aucune entrée n'existe, elle crée une nouvelle entrée pour l'utilisateur avec un compte initial de 1.
   *
   * @param {string} email - L'adresse email associée à la tentative de connexion échouée.
   * @returns {Promise<void>} Une promesse qui se résout une fois l'incrémentation terminée.
   */
  async incrementFailedLoginAttempts(email: string): Promise<void> {
    // Vérifier si une entrée existe déjà pour cet utilisateur dans le modèle FailedLoginAttempts
    const existingAttempts = await this.prisma.failedLoginAttempts.findFirst({
      where: {
        userEmail: email,
      },
    });

    if (existingAttempts) {
      // Mettre à jour l'entrée existante avec le nombre de tentatives échouées
      await this.prisma.failedLoginAttempts.update({
        where: {
          id: existingAttempts.id,
        },
        data: {
          attempts: existingAttempts.attempts + 1,
        },
      });
    } else {
      // Créer une nouvelle entrée pour cet utilisateur dans le modèle FailedLoginAttempts
      await this.prisma.failedLoginAttempts.create({
        data: {
          userEmail: email,
          attempts: 1,
        },
      });
    }
  }

  /**
   * Récupère de manière asynchrone le nombre de tentatives de connexion échouées pour une adresse e-mail donnée.
   *
   * Cette méthode interroge le modèle FailedLoginAttempts pour obtenir le nombre de tentatives
   * échouées associées à l'adresse e-mail spécifiée. Si aucune entrée n'est trouvée, elle retourne 0.
   *
   * @param {string} email - L'adresse e-mail pour laquelle récupérer le nombre de tentatives échouées.
   * @returns {Promise<number>} Une promesse qui se résout avec le nombre de tentatives échouées.
   */
  async getFailedLoginAttempts(email: string): Promise<number> {
    // Récupérer le nombre de tentatives échouées pour un utilisateur donné
    const failedLoginAttempts = await this.prisma.failedLoginAttempts.findFirst(
      {
        where: {
          userEmail: email,
        },
      },
    );

    // Retourner le nombre de tentatives échouées, ou 0 si aucune entrée n'est trouvée
    return failedLoginAttempts ? failedLoginAttempts.attempts : 0;
  }

  /**
   * Récupère de manière asynchrone la date jusqu'à laquelle l'utilisateur est verrouillé suite à des tentatives de connexion échouées.
   *
   * Cette méthode interroge le modèle LockoutInformation pour obtenir la date jusqu'à laquelle
   * l'utilisateur associé à l'adresse e-mail spécifiée est verrouillé. Si aucune entrée n'est trouvée,
   * elle retourne null, indiquant que l'utilisateur n'est pas actuellement verrouillé.
   *
   * @param {string} email - L'adresse e-mail de l'utilisateur pour lequel récupérer la date de verrouillage.
   * @returns {Promise<number | null>} Une promesse qui se résout avec la date jusqu'à laquelle l'utilisateur est verrouillé, ou null si l'utilisateur n'est pas verrouillé.
   */
  async getLockoutUntil(email: string): Promise<number | null> {
    // Récupérer la date jusqu'à laquelle l'utilisateur est verrouillé
    const lockoutUntil = await this.prisma.lockoutInformation.findFirst({
      where: {
        userEmail: email,
      },
    });

    // Retourner la date jusqu'à laquelle l'utilisateur est verrouillé, ou null si aucune entrée n'est trouvée
    return lockoutUntil ? lockoutUntil.lockoutUntil.getTime() : null;
  }

  /**
   * Réinitialise de manière asynchrone le nombre de tentatives de connexion échouées pour une adresse e-mail donnée.
   *
   * Cette méthode supprime toutes les entrées correspondantes dans le modèle FailedLoginAttempts
   * associées à l'adresse e-mail spécifiée, réinitialisant ainsi le compteur de tentatives échouées.
   *
   * @param {string} email - L'adresse e-mail pour laquelle réinitialiser le nombre de tentatives échouées.
   * @returns {Promise<void>} Une promesse qui se résout une fois la réinitialisation terminée.
   */
  async resetFailedLoginAttempts(email: string): Promise<void> {
    // Supprimer l'entrée correspondante dans le modèle FailedLoginAttempts
    await this.prisma.failedLoginAttempts.deleteMany({
      where: {
        userEmail: email,
      },
    });
  }

  /**
   * Définit de manière asynchrone la date jusqu'à laquelle l'utilisateur est verrouillé suite à des tentatives de connexion échouées.
   *
   * Cette méthode vérifie si une entrée existe déjà pour l'utilisateur dans le modèle LockoutInformation.
   * Si une entrée existe, elle met à jour l'entrée existante avec la nouvelle date de verrouillage.
   * Si aucune entrée n'existe, elle crée une nouvelle entrée pour l'utilisateur avec la date de verrouillage spécifiée.
   *
   * @param {string} email - L'adresse e-mail de l'utilisateur pour lequel définir la date de verrouillage.
   * @param {number} lockoutUntil - La date jusqu'à laquelle l'utilisateur sera verrouillé, exprimée en timestamp.
   * @returns {Promise<void>} Une promesse qui se résout une fois la définition de la date de verrouillage terminée.
   */
  async setLockoutUntil(email: string, lockoutUntil: number): Promise<void> {
    // Vérifier si une entrée existe déjà pour cet utilisateur dans le modèle LockoutInformation
    const existingLockout = await this.prisma.lockoutInformation.findFirst({
      where: {
        userEmail: email,
      },
    });

    // Si une entrée existe, la mettre à jour avec la nouvelle date de verrouillage
    if (existingLockout) {
      await this.prisma.lockoutInformation.update({
        where: {
          id: existingLockout.id,
        },
        data: {
          lockoutUntil: new Date(lockoutUntil),
        },
      });
    } else {
      // Si aucune entrée n'existe, créer une nouvelle entrée pour l'utilisateur avec la date de verrouillage spécifiée
      await this.prisma.lockoutInformation.create({
        data: {
          userEmail: email,
          lockoutUntil: new Date(lockoutUntil),
        },
      });
    }
  }
}
