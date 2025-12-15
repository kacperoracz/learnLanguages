import { Routes } from '@angular/router';
import { LanguageListComponent } from './language-list/language-list';
import { AddLanguage } from './add-language/add-language';
import { LearnLanguage } from './learn-language/learn-language';
import { AddWords } from './add-words/add-words';
import { Summary } from './summary/summary';
import { LanguageOptions } from './language-options/language-options';

export const routes: Routes = [{ path: '', component: LanguageListComponent },
    { path: 'add-language', component: AddLanguage },
    { path: 'learn-language', component: LearnLanguage },
    { path: 'add-words', component: AddWords },
    { path: 'summary', component: Summary },
    { path: 'language-options/:lang', component: LanguageOptions }];
