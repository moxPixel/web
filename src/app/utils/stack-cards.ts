type StackCardsInstance = {
  element: HTMLElement;
  items: HTMLElement[];
  marginY: number;
  cardTop: number;
  cardHeight: number;
  elementHeight: number;
  windowHeight: number;
  scrollingFn?: () => void;
  ticking: boolean;
  intersectionObserver?: IntersectionObserver;
  resizeHandler?: () => void;
};

const STACK_CONTAINER_SELECTOR = '.js-stack-cards';
const STACK_ITEM_SELECTOR = '.js-stack-cards__item';

export function initStackCards(root: Document | HTMLElement = document): () => void {
  if (typeof window === 'undefined' || !root) {
    return () => {};
  }

  const scope = root as Document | HTMLElement;
  const containers = Array.from(scope.querySelectorAll(STACK_CONTAINER_SELECTOR)) as HTMLElement[];

  const instances = containers
    .map<StackCardsInstance | null>((element) => {
      const items = Array.from(element.querySelectorAll(STACK_ITEM_SELECTOR)) as HTMLElement[];
      if (!items.length) return null;

      const instance: StackCardsInstance = {
        element,
        items,
        marginY: 0,
        cardTop: 0,
        cardHeight: 0,
        elementHeight: 0,
        windowHeight: window.innerHeight,
        ticking: false
      };

      setupInstance(instance);
      instance.intersectionObserver = new IntersectionObserver(
        (entries) => handleIntersection(entries, instance),
        { threshold: [0, 1] }
      );
      instance.intersectionObserver.observe(element);

      const resizeHandler = () => {
        setupInstance(instance);
        updateTransforms(instance);
      };

      window.addEventListener('resize', resizeHandler);
      instance.resizeHandler = resizeHandler;

      return instance;
    })
    .filter((item): item is StackCardsInstance => !!item);

  return () => {
    instances.forEach((instance) => {
      if (instance.scrollingFn) {
        window.removeEventListener('scroll', instance.scrollingFn);
      }
      instance.intersectionObserver?.disconnect();
      if (instance.resizeHandler) {
        window.removeEventListener('resize', instance.resizeHandler);
      }
    });
  };
}

function setupInstance(instance: StackCardsInstance): void {
  const { element, items } = instance;

  instance.marginY = readGapValue(element);
  instance.elementHeight = element.offsetHeight;
  instance.windowHeight = window.innerHeight;

  const firstStyle = getComputedStyle(items[0]);
  instance.cardTop = parseFloat(firstStyle.getPropertyValue('top')) || 0;
  instance.cardHeight = parseFloat(firstStyle.getPropertyValue('height')) || items[0].offsetHeight;

  if (!instance.marginY || Number.isNaN(instance.marginY)) {
    element.style.paddingBottom = '0px';
    items.forEach((item) => {
      item.style.transform = 'none';
    });
    return;
  }

  element.style.paddingBottom = `${instance.marginY * (items.length - 1)}px`;

  items.forEach((item, index) => {
    // Lire le translateX depuis le CSS avant que le JS ne le modifie
    const translateX = getTranslateXFromCSS(item, index);
    // Utiliser translate3d pour forcer l'accélération GPU
    item.style.transform = `translate3d(${translateX}, ${instance.marginY * index}px, 0)`;
  });
}

function handleIntersection(entries: IntersectionObserverEntry[], instance: StackCardsInstance): void {
  const entry = entries[0];
  if (!entry) return;

  if (entry.isIntersecting) {
    if (!instance.scrollingFn) {
      instance.scrollingFn = () => handleScroll(instance);
      window.addEventListener('scroll', instance.scrollingFn, { passive: true });
      // appliquer immédiatement pour éviter le flash avant le premier scroll
      handleScroll(instance);
    }
  } else if (instance.scrollingFn) {
    window.removeEventListener('scroll', instance.scrollingFn);
    instance.scrollingFn = undefined;
  }
}

function handleScroll(instance: StackCardsInstance): void {
  if (instance.ticking) return;
  instance.ticking = true;
  window.requestAnimationFrame(() => {
    updateTransforms(instance);
    instance.ticking = false;
  });
}

function updateTransforms(instance: StackCardsInstance): void {
  const { marginY, items } = instance;
  if (!marginY || !items.length) {
    return;
  }

  const elementTop = instance.element.getBoundingClientRect().top;
  const limit =
    instance.cardTop -
    elementTop +
    instance.windowHeight -
    instance.elementHeight -
    instance.cardHeight +
    marginY +
    marginY * items.length;

  if (limit > 0) {
    return;
  }

  items.forEach((item, index) => {
    // Lire le translateX depuis le CSS
    const translateX = getTranslateXFromCSS(item, index);
    
    const offset = instance.cardTop - elementTop - index * (instance.cardHeight + marginY);
    if (offset > 0 && index !== items.length - 1) {
      const scale = (instance.cardHeight - 0.05 * offset) / instance.cardHeight;
      const finalScale = Math.max(0.85, Math.min(1, scale));
      // Utiliser translate3d pour forcer l'accélération GPU
      item.style.transform = `translate3d(${translateX}, ${marginY * index}px, 0) scale(${finalScale})`;
      item.style.willChange = 'transform';
    } else {
      item.style.transform = `translate3d(${translateX}, ${marginY * index}px, 0)`;
      item.style.willChange = 'auto';
    }
  });
}

function readGapValue(element: HTMLElement): number {
  const rawValue = getComputedStyle(element).getPropertyValue('--stack-cards-gap').trim();
  if (!rawValue) return 0;

  const temp = document.createElement('div');
  temp.style.opacity = '0';
  temp.style.pointerEvents = 'none';
  temp.style.position = 'absolute';
  temp.style.height = rawValue;
  element.appendChild(temp);

  const height = parseFloat(getComputedStyle(temp).getPropertyValue('height')) || 0;
  element.removeChild(temp);
  return height;
}

function getTranslateXFromCSS(item: HTMLElement, index: number): string {
  // Valeurs de décalage horizontal depuis le CSS (nth-child)
  const translateXValues: { [key: number]: string } = {
    0: '12px',   // nth-child(1)
    1: '-16px',  // nth-child(2)
    2: '20px',   // nth-child(3)
    3: '-12px'   // nth-child(4)
  };
  
  return translateXValues[index] || '0px';
}

