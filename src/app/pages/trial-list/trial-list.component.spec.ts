import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { NotificationsService } from '../../services/notifications.service';
import { Trial } from '../../types/trial.types';
import { TrialListComponent } from './trial-list.component';

describe('TrialListComponent', () => {
  let component: TrialListComponent;
  let fixture: ComponentFixture<TrialListComponent>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockNotificationsService: jasmine.SpyObj<NotificationsService>;

  const mockTrials: Trial[] = [
    {
      id: 'NCT00001111',
      name: 'Test Trial 1',
      description: 'Description for test trial 1',
      phase: 'Phase 2',
      status: 'RECRUITING',
      startDate: '2023-01-01',
    },
    {
      id: 'NCT00002222',
      name: 'Test Trial 2',
      description: 'Description for test trial 2',
      phase: 'Phase 3',
      status: 'ACTIVE_NOT_RECRUITING',
      startDate: '2023-02-01',
    },
  ];

  beforeEach(async () => {
    mockApiService = jasmine.createSpyObj('ApiService', [
      'getRandomTrials',
      'getRandomSingleTrial',
      'addToFavorites',
      'addMultipleToFavorites',
    ]);

    mockNotificationsService = jasmine.createSpyObj('NotificationsService', [
      'showAddedToFavorites',
      'showMultipleAddedToFavorites',
    ]);

    mockApiService.getRandomTrials.and.returnValue(of(mockTrials));
    mockApiService.getRandomSingleTrial.and.returnValue(of([mockTrials[0]]));
    mockApiService.addToFavorites.and.returnValue(of(undefined));
    mockApiService.addMultipleToFavorites.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [TrialListComponent, RouterTestingModule],
      providers: [
        { provide: ApiService, useValue: mockApiService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TrialListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty trials array and load trials on init', () => {
    const freshComponent = fixture.componentInstance;
    expect(freshComponent.trials.length).toBe(2);
    expect(freshComponent.loading).toBe(false);
    expect(freshComponent.error).toBeNull();
    expect(freshComponent.timerActive).toBe(false);
    expect(freshComponent.selectedTrials.size).toBe(0);
  });

  it('should load trials when loadTrials is called', () => {
    component.trials = [];
    component.loadTrials();
    expect(component.loading).toBe(false);
    expect(mockApiService.getRandomTrials).toHaveBeenCalled();
    expect(component.trials).toEqual(mockTrials);
    expect(component.error).toBeNull();
  });

  it('should handle error when loading trials fails', () => {
    mockApiService.getRandomTrials.and.returnValue(throwError(() => new Error('API Error')));

    component.loadTrials();

    expect(component.loading).toBe(false);
    expect(component.error).toContain('Failed to load trials');
  });

  it('should toggle timer state when toggleTimer is called', () => {
    expect(component.timerActive).toBe(false);

    component.toggleTimer();
    expect(component.timerActive).toBe(true);

    component.toggleTimer();
    expect(component.timerActive).toBe(false);
  });

  it('should fetch a new trial when startTimer is called', () => {
    spyOn(component, 'fetchNewTrial');

    component.startTimer();

    expect(component.timerActive).toBe(true);
    expect(component.fetchNewTrial).toHaveBeenCalled();
  });

  it('should stop the timer when stopTimer is called', fakeAsync(() => {
    component.startTimer();
    expect(component.timerActive).toBe(true);

    component.stopTimer();

    expect(component.timerActive).toBe(false);
    expect(component.timerSubscription).toBeUndefined();
  }));

  it('should fetch new trial when fetchNewTrial is called', () => {
    // @ts-expect-error Private method access for testing
    spyOn(component, 'fetchTrialWithRetry');

    component.fetchNewTrial();

    // @ts-expect-error Private method access for testing
    expect(component.fetchTrialWithRetry).toHaveBeenCalledWith(0);
  });

  it('should process new trial correctly', () => {
    component.trials = [...mockTrials];

    const newTrial: Trial = {
      id: 'NCT00003333',
      name: 'New Test Trial',
      description: 'Description for new test trial',
      phase: 'Phase 1',
      status: 'RECRUITING',
      startDate: '2023-03-01',
    };

    // @ts-expect-error Private method access for testing
    component.processNewTrial(newTrial);

    expect(component.trials[0].id).toBe('NCT00003333');
    expect(component.trials[0].isNew).toBe(true);

    expect(component.trials.length).toBe(3);
    expect(component.trials.length).toBe(3);
  });

  it('should toggle selection of a trial', () => {
    const trialId = mockTrials[0].id;

    expect(component.isSelected(trialId)).toBeFalse();

    component.toggleSelection(trialId);
    expect(component.isSelected(trialId)).toBeTrue();
    expect(component.selectedTrials.size).toBe(1);

    component.toggleSelection(trialId);
    expect(component.isSelected(trialId)).toBeFalse();
    expect(component.selectedTrials.size).toBe(0);
  });

  it('should add a trial to favorites', () => {
    const trial = mockTrials[0];

    component.addToFavorites(trial);

    expect(mockApiService.addToFavorites).toHaveBeenCalledWith(trial);
  });

  it('should add selected trials to favorites', () => {
    component.trials = [...mockTrials];
    component.toggleSelection(mockTrials[0].id);
    component.toggleSelection(mockTrials[1].id);

    component.addSelectedToFavorites();

    expect(mockApiService.addMultipleToFavorites).toHaveBeenCalledWith(
      jasmine.arrayContaining(mockTrials)
    );
    expect(component.selectedTrials.size).toBe(0);
  });

  it('should not add to favorites if no trials selected', () => {
    component.addSelectedToFavorites();

    expect(mockApiService.addMultipleToFavorites).not.toHaveBeenCalled();
  });

  it('should render trials list when there are trials', () => {
    const trialsList = fixture.debugElement.query(By.css('.trials-list'));
    expect(trialsList).toBeTruthy();

    const trialItems = fixture.debugElement.queryAll(By.css('.trial-item'));
    expect(trialItems.length).toBe(2);

    const firstTrial = trialItems[0];
    const trialHeading = firstTrial.query(By.css('h3')).nativeElement;
    expect(trialHeading.textContent).toContain(mockTrials[0].name);
  });

  it('should render placeholder when there are no trials', () => {
    component.trials = [];
    fixture.detectChanges();

    const placeholder = fixture.debugElement.query(By.css('.trials-placeholder'));
    expect(placeholder).toBeTruthy();
    expect(placeholder.nativeElement.textContent).toContain('No trials found');
  });

  it('should render navigation links', () => {
    const navLinks = fixture.debugElement.queryAll(By.css('.nav-link'));
    expect(navLinks.length).toBe(2);

    expect(navLinks[0].attributes['routerLink']).toBe('/home');
    expect(navLinks[1].attributes['routerLink']).toBe('/favorites');
  });

  it('should properly handle trials limit', () => {
    const manyTrials: Trial[] = Array.from({ length: 11 }, (_, i) => ({
      id: `NCT${i.toString().padStart(8, '0')}`,
      name: `Trial ${i}`,
      description: `Description ${i}`,
      phase: 'Phase 2',
      status: 'RECRUITING',
      startDate: '2023-01-01',
    }));

    component.trials = manyTrials;

    const newTrial: Trial = {
      id: 'NEW_TRIAL',
      name: 'New Trial',
      description: 'New Description',
      phase: 'Phase 1',
      status: 'RECRUITING',
      startDate: '2023-03-01',
    };

    // @ts-expect-error Private method access for testing
    component.processNewTrial(newTrial);

    expect(component.trials.length).toBe(10);

    expect(component.trials[0].id).toBe('NEW_TRIAL');
  });

  it('should unsubscribe from timer on destroy', () => {
    component.startTimer();
    const sub = component.timerSubscription;
    spyOn(sub!, 'unsubscribe');

    component.ngOnDestroy();

    expect(sub!.unsubscribe).toHaveBeenCalled();
  });
});
