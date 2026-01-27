# UI Komponens Dokumentáció

Modern, akcesibilis és felhasználó-barát UI komponensek a React alkalmazáshoz.

## 📦 Komponensek

### Button
Rugalmas gomb komponens több state-tel (primary, secondary, danger, success, ghost).

```jsx
import { Button } from './components/UI';

// Basic usage
<Button>Click me</Button>

// With variants
<Button variant="primary">Primary</Button>
<Button variant="danger">Delete</Button>

// With loading
<Button loading>Processing...</Button>

// Full width
<Button fullWidth>Full Width Button</Button>

// With icon
<Button icon={TrashIcon} iconPosition="right">
  Delete Item
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean
- `loading`: boolean
- `fullWidth`: boolean
- `icon`: React component
- `iconPosition`: 'left' | 'right' (default: 'left')

### Input
Fejlett form input autoanimációkkal és validációs feedback-kel.

```jsx
import { Input, Textarea, Select, Checkbox } from './components/UI';

// Basic input
<Input 
  label="Email" 
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

// With error
<Input 
  label="Username"
  error="Username már foglalt"
  required
/>

// Textarea
<Textarea 
  label="Message"
  rows={5}
  helperText="Maximum 500 characters"
/>

// Select
<Select
  label="Kategória"
  options={[
    { value: 'salon', label: 'Szalon' },
    { value: 'stylist', label: 'Fodrász' }
  ]}
/>

// Checkbox
<Checkbox 
  label="Elfogadom a feltételeket"
  checked={agreed}
  onChange={(e) => setAgreed(e.target.checked)}
/>
```

### Modal
Rugalmas modális ablak komponens.

```jsx
import { Modal, ConfirmModal, useModal } from './components/UI';

// Using hook
const modal = useModal();

<Modal
  isOpen={modal.isOpen}
  onClose={modal.close}
  title="Megerősítés szükséges"
  size="md"
  footer={
    <div className="confirm-modal-footer">
      <Button variant="secondary" onClick={modal.close}>
        Mégse
      </Button>
      <Button variant="primary" onClick={handleConfirm}>
        Igen, folytatom
      </Button>
    </div>
  }
>
  <p>Biztosan folytatod ezt az akciót?</p>
</Modal>

// Confirm modal
<ConfirmModal
  isOpen={showConfirm}
  title="Törlés megerősítése"
  message="Ez az akció nem visszavonható!"
  confirmText="Törlés"
  cancelText="Mégse"
  variant="danger"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
/>
```

### Toast Notifications
System-wide notifikáció komponens.

```jsx
import { useToast } from './components/UI';

function MyComponent() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await saveData();
      toast.success('Sikeres mentés!', { title: 'Siker' });
    } catch (error) {
      toast.error('Mentési hiba!', { title: 'Hiba' });
    }
  };

  return (
    <button onClick={handleSave}>Mentés</button>
  );
}
```

**Toast típusok:**
- `toast.success(message, options)`
- `toast.error(message, options)`
- `toast.warning(message, options)`
- `toast.info(message, options)`

**Options:**
- `title`: string (opcionális)
- `duration`: number (ms, default: 4000)

### Skeleton Loading
Betöltési végeredmény animációs komponensek.

```jsx
import { DashboardSkeleton, CardSkeleton, ListSkeleton } from './components/UI';

// Dashboard skeleton
{loading && <DashboardSkeleton />}

// Card skeleton
{loading && <CardSkeleton />}

// List skeleton with custom count
{loading && <ListSkeleton count={10} />}
```

### Page Transitions
Oldal közötti animációk framer-motion-nal.

```jsx
import { PageTransition, SlideTransition } from './components/UI';

<PageTransition>
  <div>Fade transition</div>
</PageTransition>

<SlideTransition direction="right">
  <div>Slide from right</div>
</SlideTransition>
```

## 🎨 CSS Variables

Globálisan elérhető design system:

```css
/* Colors */
--bg: #0b0b0f;
--panel: #0f1117;
--text: #e8e8f0;
--muted: #6b7280;

--brand: #5b8cff;
--brand2: #a06bff;

--success: #22c55e;
--danger: #ef4444;
--warning: #f59e0b;
--info: #3b82f6;

/* Shadows */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
--shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
--shadow-lg: 0 12px 32px rgba(0, 0, 0, 0.35);

/* Border radius */
--radius-sm: 8px;
--radius: 12px;
--radius-lg: 16px;

/* Spacing */
--spacing-sm: 8px;
--spacing-md: 12px;
--spacing-lg: 16px;
--spacing-xl: 24px;
```

## ♿ Accessibility Features

- ✅ WCAG AA szintű szín kontrasztat
- ✅ Keyboard navigáció támogatás
- ✅ ARIA labels és descriptions
- ✅ Focus states minden interaktív elemre
- ✅ Reduced motion support
- ✅ Screen reader friendly
- ✅ Minimum 44x44px touch targets

## 🔄 Integráció

1. **App.js-ben** - Importáld a ToastProvider-t:

```jsx
import { ToastProvider } from './components/UI';

function App() {
  return (
    <ToastProvider>
      {/* Your app content */}
    </ToastProvider>
  );
}
```

2. **Komponensekben** - Importáld szükség szerint:

```jsx
import { Button, Input, Modal, useToast } from './components/UI';
```

## 📝 Best Practices

1. **Validáció** - Mindig add meg az `error` props-t form mezőkre
2. **Loading states** - Használd a `loading` prop-t hosszabb operációkra
3. **Feedback** - Mindig adjon Toast notifikációt sikeres/sikertelen akciók után
4. **Accessibility** - Mindig add meg a label-eket, ARIA descriptions-t
5. **Error handling** - Szép error üzenetek megjelenítése

## 🚀 Performance

- ✅ Framer Motion smooth animációkkal
- ✅ Lazy loaded komponensek
- ✅ Optimalizált CSS transitions
- ✅ Minimal DOM updates
