import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { RouterLinkWithHref } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  let component: NavbarComponent;
  let fixture: ComponentFixture<NavbarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent, RouterTestingModule.withRoutes([])],
    }).compileComponents();

    fixture = TestBed.createComponent(NavbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have a default empty title', () => {
    expect(component.title).toBe('');
  });

  it('should set title when input is provided', () => {
    component.title = 'Test Title';
    expect(component.title).toBe('Test Title');
  });

  it('should display "Clinical Trials Management" as heading', () => {
    const h1Element = fixture.debugElement.query(By.css('h1')).nativeElement;
    expect(h1Element.textContent).toContain('Clinical Trials Management');
  });

  it('should have three navigation links', () => {
    const navLinks = fixture.debugElement.queryAll(By.css('nav a'));
    expect(navLinks.length).toBe(3);
  });

  it('should have correct routerLinks for navigation items', () => {
    const navLinks = fixture.debugElement.queryAll(By.css('nav a'));

    const homeLink = navLinks[0].injector.get(RouterLinkWithHref);
    const trialsLink = navLinks[1].injector.get(RouterLinkWithHref);
    const favoritesLink = navLinks[2].injector.get(RouterLinkWithHref);

    expect(homeLink.href).toBe('/home');
    expect(trialsLink.href).toBe('/trials');
    expect(favoritesLink.href).toBe('/favorites');
  });

  it('should have correct text content for navigation links', () => {
    const navLinks = fixture.debugElement.queryAll(By.css('nav a'));

    expect(navLinks[0].nativeElement.textContent).toBe('Home');
    expect(navLinks[1].nativeElement.textContent).toBe('Trials');
    expect(navLinks[2].nativeElement.textContent).toBe('Favorites');
  });
});
