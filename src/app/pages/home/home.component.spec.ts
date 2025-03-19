import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { By } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { RouterLinkWithHref } from '@angular/router';

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule.withRoutes([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the main heading', () => {
    const headingElement = fixture.debugElement.query(By.css('h1')).nativeElement;
    expect(headingElement.textContent).toContain('Streamline Your Clinical Trial Management');
  });

  it('should render the subtitle and description', () => {
    const subtitleElement = fixture.debugElement.query(By.css('.subtitle')).nativeElement;
    const descriptionElement = fixture.debugElement.query(By.css('.description')).nativeElement;
    
    expect(subtitleElement.textContent).toContain('Discover, track, and manage clinical trials');
    expect(descriptionElement.textContent).toContain('Our tool helps researchers');
  });

  it('should have an image in the image section', () => {
    const imageElement = fixture.debugElement.query(By.css('.hero-image'));
    expect(imageElement).toBeTruthy();
    expect(imageElement.attributes['src']).toBe('assets/images/home.jpg');
    expect(imageElement.attributes['alt']).toBe('Clinical Trials Platform');
  });

  it('should have two CTA buttons', () => {
    const ctaButtons = fixture.debugElement.queryAll(By.css('.cta-buttons a'));
    expect(ctaButtons.length).toBe(2);
  });

  it('should have correct routerLinks for CTA buttons', () => {
    const ctaButtons = fixture.debugElement.queryAll(By.css('.cta-buttons a'));
    
    const browseTrialsButton = ctaButtons[0].injector.get(RouterLinkWithHref);
    const viewFavoritesButton = ctaButtons[1].injector.get(RouterLinkWithHref);
    
    expect(browseTrialsButton.href).toBe('/trials');
    expect(viewFavoritesButton.href).toBe('/favorites');
  });

  it('should have correct text content for CTA buttons', () => {
    const ctaButtons = fixture.debugElement.queryAll(By.css('.cta-buttons a'));
    
    expect(ctaButtons[0].nativeElement.textContent).toBe('Browse Trials');
    expect(ctaButtons[1].nativeElement.textContent).toBe('View Favorites');
  });

  it('should render the landing container with proper structure', () => {
    const landingContainer = fixture.debugElement.query(By.css('.landing-container'));
    const contentSection = fixture.debugElement.query(By.css('.content-section'));
    const imageSection = fixture.debugElement.query(By.css('.image-section'));
    
    expect(landingContainer).toBeTruthy();
    expect(contentSection).toBeTruthy();
    expect(imageSection).toBeTruthy();
  });
}); 