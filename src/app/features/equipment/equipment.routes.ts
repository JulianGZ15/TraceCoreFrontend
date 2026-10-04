import { Routes } from '@angular/router';

import { accessGuard } from '../../core/auth/guards';

import { equipmentDraftGuard } from './page-base';

export const catalogRoutes:Routes=[{path:'',pathMatch:'full',redirectTo:'categorias'},

{path:'categorias',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/categories/categories.component').then(m=>m.CategoriesComponent)},

{path:'modelos',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/models/models.component').then(m=>m.ModelsComponent)},

{path:'modelos/:uuid',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/model-detail/model-detail.component').then(m=>m.ModelDetailComponent)},

{path:'modelos/:modelUuid/fichas/nueva',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},canDeactivate:[equipmentDraftGuard],loadComponent:()=>import('./pages/sheet/sheet.component').then(m=>m.SheetComponent)},

{path:'fichas/:uuid',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},canDeactivate:[equipmentDraftGuard],loadComponent:()=>import('./pages/sheet/sheet.component').then(m=>m.SheetComponent)},

{path:'grados',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/grades/grades.component').then(m=>m.GradesComponent)},

{path:'coladas',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/heats/heats.component').then(m=>m.HeatsComponent)},

{path:'lotes',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/lots/lots.component').then(m=>m.LotsComponent)},

{path:'lotes/:uuid',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/lot-detail/lot-detail.component').then(m=>m.LotDetailComponent)}];

export const assetRoutes:Routes=[{path:'',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/assets/assets.component').then(m=>m.AssetsComponent)},{path:'nuevo',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ',permissions:['EQUIPMENT_MANAGE','OWNERSHIP_MANAGE']},canDeactivate:[equipmentDraftGuard],loadComponent:()=>import('./pages/registration/registration.component').then(m=>m.RegistrationComponent)},{path:':uuid',canActivate:[accessGuard],canActivateChild:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/dossier/dossier.component').then(m=>m.DossierComponent),children:[{path:'',pathMatch:'full',redirectTo:'general'},{path:'general',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/asset-general/asset-general.component').then(m=>m.AssetGeneralComponent)},{path:'tecnica',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/asset-technical/asset-technical.component').then(m=>m.AssetTechnicalComponent)},{path:'materiales',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/materials/materials.component').then(m=>m.MaterialsComponent)},{path:'propiedad',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/ownership/ownership.component').then(m=>m.OwnershipComponent)},{path:'condicion',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/conditions/conditions.component').then(m=>m.ConditionsComponent)},{path:'lotes',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/asset-lots/asset-lots.component').then(m=>m.AssetLotsComponent)},{path:'composicion',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/composition/composition.component').then(m=>m.CompositionComponent)},{path:'uso',canActivate:[accessGuard],data:{permission:'EQUIPMENT_READ'},loadComponent:()=>import('./pages/usage/usage.component').then(m=>m.UsageComponent)}]}];

