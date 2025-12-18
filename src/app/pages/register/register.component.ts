import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthApiService } from '../../services/api/auth-api.service';
import { RoleOption, UserRole, RegisterDto } from '../../interfaces/auth.interface';
import { getRippleColorAuto } from '../../utils/ripple.util';
import { GsapScrollService } from '../../services/gsap-scroll.service';
import { PageLoaderInlineService } from '../../services/page-loader-inline.service';
import { SeoService } from '../../services/seo.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatRippleModule, MatIconModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RegisterComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('registerParallax', { static: false }) registerParallax!: ElementRef;
  private heroParallaxTween?: gsap.core.Tween;
  private destroy$ = new Subject<void>();
  // Données du formulaire
  email = '';
  password = '';
  confirmPassword = '';
  firstName = '';
  lastName = '';
  phone = '';
  role: UserRole = UserRole.INDIVIDUAL;
  
  // Données spécifiques entreprise
  companyName = '';
  siret = '';
  
  // Données spécifiques particulier
  address = '';
  city = '';
  postalCode = '';
  country = 'France';
  
  // État
  loading = false;
  error: string | null = null;
  roles: RoleOption[] = [];
  showCompanyFields = false;
  showPersonalFields = false;

  // Validation du mot de passe
  get passwordValidation() {
    return {
      minLength: this.password.length >= 8,
      hasUpperCase: /[A-Z]/.test(this.password),
      hasLowerCase: /[a-z]/.test(this.password),
      hasNumber: /[0-9]/.test(this.password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(this.password),
      passwordsMatch: this.password === this.confirmPassword && this.confirmPassword.length > 0,
    };
  }

  get isPasswordValid(): boolean {
    const val = this.passwordValidation;
    return val.minLength && val.hasUpperCase && val.hasLowerCase && val.hasNumber && val.hasSpecialChar;
  }

  get passwordStrength(): number {
    const val = this.passwordValidation;
    let strength = 0;
    if (val.minLength) strength += 20;
    if (val.hasUpperCase) strength += 20;
    if (val.hasLowerCase) strength += 20;
    if (val.hasNumber) strength += 20;
    if (val.hasSpecialChar) strength += 20;
    return strength;
  }

  get passwordStrengthLabel(): string {
    const strength = this.passwordStrength;
    if (strength === 0) return '';
    if (strength <= 40) return 'Faible';
    if (strength <= 60) return 'Moyen';
    if (strength < 100) return 'Bon';
    return 'Excellent';
  }

  get passwordStrengthColor(): string {
    const strength = this.passwordStrength;
    if (strength <= 40) return 'bg-red-500';
    if (strength <= 60) return 'bg-orange-500';
    if (strength < 100) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  private router = inject(Router);
  private authService = inject(AuthApiService);
  private gsapScroll = inject(GsapScrollService);
  private pageLoaderInline = inject(PageLoaderInlineService);
  private readonly seoService = inject(SeoService);

  get rippleColor(): string {
    return getRippleColorAuto();
  }

  ngOnInit(): void {
    // Configuration SEO pour la page Register
    this.seoService.updateSeoData({
      title: 'Inscription | Unlock Formation',
      description: 'Créez votre compte Unlock Formation pour accéder aux formations IT & IA, suivre votre progression et gérer vos inscriptions.',
      url: '/register',
      noindex: true, // Page d'inscription ne doit pas être indexée
      type: 'website'
    });

    // Charger les rôles disponibles
    this.authService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles.filter(r => r.value !== UserRole.ADMIN); // Exclure admin
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      },
    });

    // Si déjà connecté, rediriger
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  ngAfterViewInit(): void {
    this.pageLoaderInline.loaderHidden$
      .pipe(takeUntil(this.destroy$))
      .subscribe((hidden) => {
        if (hidden && this.registerParallax && !this.heroParallaxTween) {
          setTimeout(() => {
            this.heroParallaxTween = this.gsapScroll.createParallax(
              this.registerParallax.nativeElement,
              -0.25,
              'top top',
              'bottom top'
            );
          }, 50);
        }
      });
  }

  ngOnDestroy(): void {
    this.heroParallaxTween?.scrollTrigger?.kill();
    this.heroParallaxTween?.kill();
    this.heroParallaxTween = undefined;
    this.destroy$.next();
    this.destroy$.complete();
  }

  onRoleChange(): void {
    this.showCompanyFields = this.role === UserRole.COMPANY;
    this.showPersonalFields = this.role === UserRole.INDIVIDUAL;
    
    // Réinitialiser les champs spécifiques
    if (!this.showCompanyFields) {
      this.companyName = '';
      this.siret = '';
    }
    if (!this.showPersonalFields) {
      this.address = '';
      this.city = '';
      this.postalCode = '';
    }
  }

  onSubmit(): void {
    if (this.loading) return;

    // Validation
    if (!this.email || !this.password) {
      this.error = 'Veuillez remplir tous les champs obligatoires';
      return;
    }

    if (!this.isPasswordValid) {
      this.error = 'Le mot de passe ne respecte pas tous les critères de sécurité';
      return;
    }

    if (!this.passwordValidation.passwordsMatch) {
      this.error = 'Les mots de passe ne correspondent pas';
      return;
    }

    this.error = null;
    this.loading = true;

    const registerData: RegisterDto = {
      email: this.email,
      password: this.password,
      firstName: this.firstName || undefined,
      lastName: this.lastName || undefined,
      phone: this.phone || undefined,
      role: this.role,
      companyName: this.showCompanyFields ? this.companyName : undefined,
      siret: this.showCompanyFields ? this.siret : undefined,
      address: this.showPersonalFields ? this.address : undefined,
      city: this.showPersonalFields ? this.city : undefined,
      postalCode: this.showPersonalFields ? this.postalCode : undefined,
      country: this.showPersonalFields ? this.country : undefined,
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.loading = false;
        // Rediriger vers la page de login avec un message
        this.router.navigate(['/login'], {
          queryParams: { registered: 'true' },
        });
      },
      error: (error) => {
        this.loading = false;
        this.error = error.message || 'Erreur lors de l\'inscription';
      },
    });
  }
}

