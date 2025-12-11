import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, timeout, retry } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  RegisterDto,
  LoginDto,
  AuthResponse,
  User,
  UserStatus,
  UpdateUserStatusDto,
  UpdateUserDto,
  UserQueryParams,
  RoleOption,
  UserRole,
} from '../../interfaces/auth.interface';
import { ApiResponse, PaginatedResponse } from '../../interfaces/api.interface';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;
  private usersUrl = `${environment.apiUrl}/users`;
  private currentUser$ = new BehaviorSubject<User | null>(null);

  /**
   * Observable pour suivre l'utilisateur connecté
   */
  get currentUser(): Observable<User | null> {
    return this.currentUser$.asObservable();
  }

  /**
   * Inscription
   */
  register(data: RegisterDto): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => {
        const authData = response.data!;
        this.setCurrentUser(authData.user);
        this.setToken(authData.token);
        return authData;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Connexion
   */
  login(data: LoginDto): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => {
        const authData = response.data!;
        this.setCurrentUser(authData.user);
        this.setToken(authData.token);
        return authData;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Mot de passe oublié
   */
  forgotPassword(email: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/forgot-password`, { email })
      .pipe(timeout(20000), retry({ count: 1, delay: 1000 }), map(() => undefined), catchError(this.handleError));
  }

  /**
   * Réinitialisation du mot de passe
   */
  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.http
      .post<ApiResponse<void>>(`${this.apiUrl}/reset-password?token=${encodeURIComponent(token)}`, { newPassword })
      .pipe(timeout(20000), retry({ count: 1, delay: 1000 }), map(() => undefined), catchError(this.handleError));
  }

  /**
   * Déconnexion
   */
  logout(): void {
    localStorage.removeItem('token');
    this.currentUser$.next(null);
  }

  /**
   * Obtenir le profil de l'utilisateur connecté
   */
  getProfile(): Observable<{ user: User; profile: unknown }> {
    return this.http.get<ApiResponse<{ user: User; profile: unknown }>>(`${this.apiUrl}/me`).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      map((response) => {
        const data = response.data!;
        const userWithProfile: User = { 
          ...data.user, 
          profile: data.profile as User['profile']
        };
        this.setCurrentUser(userWithProfile);
        return data;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtenir les rôles disponibles
   */
  getRoles(): Observable<RoleOption[]> {
    return this.http.get<ApiResponse<RoleOption[]>>(`${this.apiUrl}/roles`).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      map((response) => response.data || []),
      catchError(this.handleError)
    );
  }

  /**
   * Créer un utilisateur (admin seulement)
   */
  createUser(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    status: UserStatus;
  }): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.usersUrl}`, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Liste des utilisateurs (admin seulement)
   */
  getUsers(query?: UserQueryParams): Observable<PaginatedResponse<User>> {
    let params = new URLSearchParams();
    if (query) {
      Object.keys(query).forEach((key) => {
        const value = query[key as keyof UserQueryParams];
        if (value !== undefined && value !== null) {
          params.set(key, value.toString());
        }
      });
    }

    return this.http
      .get<PaginatedResponse<User>>(`${this.usersUrl}?${params.toString()}`)
      .pipe(
        timeout(20000),
        retry({ count: 2, delay: 1000 }),
        catchError(this.handleError)
      );
  }

  /**
   * Obtenir un utilisateur par ID (admin seulement)
   */
  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.usersUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 2, delay: 1000 }),
      map((response) => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour le statut d'un utilisateur (admin seulement)
   */
  updateUserStatus(id: string, data: UpdateUserStatusDto): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.usersUrl}/${id}/status`, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => response.data!),
      catchError(this.handleError)
    );
  }

  /**
   * Mettre à jour un utilisateur
   */
  updateUser(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.usersUrl}/${id}`, data).pipe(
      timeout(30000),
      retry({ count: 2, delay: 1000 }),
      map((response) => {
        const user = response.data!;
        // Si c'est le profil de l'utilisateur connecté, mettre à jour
        if (this.currentUser$.value?.id === id) {
          this.setCurrentUser(user);
        }
        return user;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Supprimer un utilisateur (admin seulement)
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.usersUrl}/${id}`).pipe(
      timeout(20000),
      retry({ count: 1, delay: 1000 }),
      map(() => undefined),
      catchError(this.handleError)
    );
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Vérifier si l'utilisateur est admin
   */
  isAdmin(): boolean {
    return this.currentUser$.value?.role === UserRole.ADMIN;
  }

  /**
   * Obtenir le token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Définir le token
   */
  private setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  /**
   * Définir l'utilisateur actuel
   */
  private setCurrentUser(user: User): void {
    this.currentUser$.next(user);
  }

  /**
   * Initialiser depuis le token stocké
   */
  initFromStorage(): void {
    const token = this.getToken();
    if (token) {
      // Vérifier le token et charger le profil
      this.getProfile().subscribe({
        error: () => {
          // Token invalide, déconnecter
          this.logout();
        },
      });
    }
  }

  /**
   * Gestion d'erreurs
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur';
          break;
        case 400:
          errorMessage = error.error?.message || 'Données invalides';
          break;
        case 401:
          errorMessage = 'Email ou mot de passe incorrect';
          break;
        case 403:
          errorMessage = error.error?.message || 'Accès non autorisé';
          break;
        case 409:
          errorMessage = error.error?.message || 'Un compte avec cet email existe déjà';
          break;
        case 500:
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
          break;
        default:
          errorMessage = error.error?.message || `Erreur ${error.status}`;
      }
    }

    console.error('Auth API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
