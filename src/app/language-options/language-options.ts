import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-language-options',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './language-options.html',
  styleUrl: './language-options.scss',
})
export class LanguageOptions {
  constructor(private router: Router) {
  }

  private route = inject(ActivatedRoute);

  goToLearnLanguage() {
    this.router.navigate(['/learn-language']);
  }

  goToAddWords(){
    this.router.navigate(['/add-words']);
  }

  goToSummary(){
    this.router.navigate(['/summary']);
  }

  back() {
    this.router.navigate(['/']);
  }
}
