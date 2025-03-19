import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { TrialFavoritesComponent } from './trial-favorites.component';
import { ApiService } from '../../services/api.service';
import { NotificationsService } from '../../services/notifications.service';
import { By } from '@angular/platform-browser';
import { Trial } from '../../types/trial.types';
import { BehaviorSubject, of } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

describe('TrialFavoritesComponent', () => {
  let component: TrialFavoritesComponent;
  let fixture: ComponentFixture<TrialFavoritesComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationsService: jasmine.SpyObj<NotificationsService>;
  let favoritesSubject: BehaviorSubject<Trial[]>;
  
  const mockTrials: Trial[] = [
    {
      id: 'NCT00001111',
      name: 'Test Trial 1',
      description: 'Description for test trial 1',
      phase: 'Phase 2',
      status: 'RECRUITING',
      startDate: '2023-01-01'
    },
    {
      id: 'NCT00002222',
      name: 'Test Trial 2',
      description: 'Description for test trial 2',
      phase: 'Phase 3',
      status: 'ACTIVE_NOT_RECRUITING',
      startDate: '2023-02-01'
    }
  ];

  beforeEach(async () => {
    favoritesSubject = new BehaviorSubject<Trial[]>([]);
    
    mockApiService = jasmine.createSpyObj('ApiService', 
      ['removeFromFavorites', 'removeMultipleFromFavorites'],
      { favorites$: favoritesSubject.asObservable() }
    );
    
    mockNotificationsService = jasmine.createSpyObj('NotificationsService', 
      ['confirmRemoveFromFavorites', 'confirmRemoveMultipleFromFavorites']
    );
    
    mockNotificationsService.confirmRemoveFromFavorites.and.resolveTo({ isConfirmed: true });
    mockNotificationsService.confirmRemoveMultipleFromFavorites.and.resolveTo({ isConfirmed: true });
    
    mockApiService.removeFromFavorites.and.returnValue(of(undefined));
    mockApiService.removeMultipleFromFavorites.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [TrialFavoritesComponent, RouterTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationsService, useValue: mockNotificationsService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TrialFavoritesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty favorites array', () => {
    expect(component.favorites).toEqual([]);
    expect(component.selectedTrials.size).toBe(0);
  });

  it('should update favorites when apiService.favorites$ emits', () => {
    favoritesSubject.next(mockTrials);
    expect(component.favorites).toEqual(mockTrials);
    expect(component.favorites.length).toBe(2);
  });

  it('should toggle selection of a trial', () => {
    const trialId = 'NCT00001111';
    
    expect(component.isSelected(trialId)).toBeFalse();
    
    component.toggleSelection(trialId);
    expect(component.isSelected(trialId)).toBeTrue();
    expect(component.selectedTrials.size).toBe(1);
    
    component.toggleSelection(trialId);
    expect(component.isSelected(trialId)).toBeFalse();
    expect(component.selectedTrials.size).toBe(0);
  });

  it('should not call api service if confirmation is canceled', fakeAsync(() => {
    favoritesSubject.next(mockTrials);
    fixture.detectChanges();
    mockNotificationsService.confirmRemoveFromFavorites.and.resolveTo({ isConfirmed: false });
    
    component.removeFromFavorites(mockTrials[0].id);
    tick();
    
    expect(mockApiService.removeFromFavorites).not.toHaveBeenCalled();
  }));

  it('should call removeFromFavorites with the correct trial ID', fakeAsync(() => {
    favoritesSubject.next(mockTrials);
    fixture.detectChanges();
    const trialId = mockTrials[0].id;
    
    component.removeFromFavorites(trialId);
    tick();
    
    expect(mockApiService.removeFromFavorites).toHaveBeenCalledWith(trialId);
  }));

  it('should remove multiple trials when selected', fakeAsync(() => {
    favoritesSubject.next(mockTrials);
    fixture.detectChanges();
    
    component.toggleSelection(mockTrials[0].id);
    component.toggleSelection(mockTrials[1].id);
    expect(component.selectedTrials.size).toBe(2);
    
    component.removeSelectedFromFavorites();
    tick();
    
    expect(mockNotificationsService.confirmRemoveMultipleFromFavorites).toHaveBeenCalledWith(2);
    expect(mockApiService.removeMultipleFromFavorites).toHaveBeenCalledWith(
      jasmine.arrayContaining([mockTrials[0].id, mockTrials[1].id])
    );
    
    expect(component.selectedTrials.size).toBe(0);
  }));

  it('should not remove trials if no trials are selected', () => {
    component.removeSelectedFromFavorites();
    
    expect(mockNotificationsService.confirmRemoveMultipleFromFavorites).not.toHaveBeenCalled();
    expect(mockApiService.removeMultipleFromFavorites).not.toHaveBeenCalled();
  });

  it('should render favorites list when there are favorites', () => {
    favoritesSubject.next(mockTrials);
    fixture.detectChanges();
    
    const favoritesList = fixture.debugElement.query(By.css('.favorites-list'));
    expect(favoritesList).toBeTruthy();
    
    const trialItems = fixture.debugElement.queryAll(By.css('.trial-item'));
    expect(trialItems.length).toBe(2);
    
    const firstTrial = trialItems[0];
    const trialHeading = firstTrial.query(By.css('h3')).nativeElement;
    expect(trialHeading.textContent).toContain(mockTrials[0].name);
  });

  it('should render placeholder when there are no favorites', () => {
    favoritesSubject.next([]);
    fixture.detectChanges();
    
    const placeholder = fixture.debugElement.query(By.css('.favorites-placeholder'));
    expect(placeholder).toBeTruthy();
    expect(placeholder.nativeElement.textContent).toContain('You haven\'t added any favorites yet');
  });

  it('should have navigation links', () => {
    const navLinks = fixture.debugElement.queryAll(By.css('.nav-link'));
    expect(navLinks.length).toBe(2);
    
    expect(navLinks[0].attributes['routerLink']).toBe('/home');
    expect(navLinks[1].attributes['routerLink']).toBe('/trials');
  });

  it('should unsubscribe on destroy', () => {
    spyOn(component['subscription'], 'unsubscribe');
    fixture.destroy();
    expect(component['subscription'].unsubscribe).toHaveBeenCalled();
  });
}); 