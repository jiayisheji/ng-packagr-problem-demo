import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectionStrategy,
  ElementRef,
  HostBinding,
  Input,
  InjectionToken,
  inject,
  OnChanges,
  AfterViewChecked,
  OnDestroy,
  Attribute,
  Optional,
  Inject,
  SimpleChanges
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { mixinColor, ThemePalette, CanColor, toBoolean } from 'simple-ui/core';
import { IconService } from './icon.service';
import { take } from 'rxjs/operators';

export class SimIconBase {
  constructor(public _elementRef: ElementRef) { }
}
export const _SimIconMixinBase = mixinColor(SimIconBase);

/**
 * 注入令牌用于向“SimIcon”提供当前位置。 用于处理服务器端呈现和在单元测试期间存根。
 */
export const SIM_ICON_LOCATION = new InjectionToken<SimIconLocation>('sim-icon-location', {
  providedIn: 'root',
  factory: SIM_ICON_LOCATION_FACTORY
});

/**
 * 找到位置 `SimIcon`.
 */
export interface SimIconLocation {
  getPathname: () => string;
}

export function SIM_ICON_LOCATION_FACTORY(): SimIconLocation {
  const _document = inject(DOCUMENT);
  const _location = _document ? _document.location : null;

  return {
    // 请注意，这需要是一个函数，而不是属性，因为Angular只会解析一次，但我们希望每次调用都有当前路径。
    getPathname: () => _location ? (_location.pathname + _location.search) : ''
  };
}


/** 接受 FuncIRI 的SVG属性（例如`url（<something>）`）。 */
const funcIriAttributes = [
  'clip-path',
  'color-profile',
  'src',
  'cursor',
  'fill',
  'filter',
  'marker',
  'marker-start',
  'marker-mid',
  'marker-end',
  'mask',
  'stroke'
];

/** 选择器，可用于查找使用`FuncIRI`的所有元素 */
const funcIriAttributeSelector = funcIriAttributes.map(attr => `[${attr}]`).join(', ');

/** 正则表达式，可用于从FuncIRI中提取id */
const funcIriPattern = /^url\(['"]?#(.*?)['"]?\)$/;

/**
 * Examples:
 * <sim-icon type="home"></sim-icon>
 *
 * 默认支持svg图标
 *
 * 可以自己设置iconfont
 */
@Component({
  // tslint:disable-next-line:component-selector
  selector: 'sim-icon',
  template: '<ng-content></ng-content>',
  styleUrls: ['./icon.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent extends _SimIconMixinBase implements OnInit, OnChanges, AfterViewChecked, CanColor, OnDestroy {
  private _element: HTMLElement;

  @HostBinding('class.sim-icon')
  get hostClass(): boolean {
    return true;
  }
  /**
   * 是否应该内联图标，自动调整图标大小以匹配图标所包含的元素的字体大小。
   */
  @Input()
  get inline(): boolean {
    return this._inline;
  }
  set inline(inline: boolean) {
    this._inline = toBoolean(inline);
  }
  private _inline = false;

  // 图标类型
  @Input() type: string;
  // 图标颜色
  @Input() color: ThemePalette;
  // 图标字体class
  @Input() iconfont: string;

  /** Name of the icon in the SVG icon set. */
  @Input() svgIcon: string;

  /** Font set that the icon is a part of. */
  @Input()
  get fontSet(): string { return this._fontSet; }
  set fontSet(value: string) {
    this._fontSet = this._cleanupFontValue(value);
  }
  private _fontSet: string;

  /** Name of an icon within a font set. */
  @Input()
  get fontIcon(): string { return this._fontIcon; }
  set fontIcon(value: string) {
    this._fontIcon = this._cleanupFontValue(value);
  }
  private _fontIcon: string;

  private _previousFontSetClass: string;
  private _previousFontIconClass: string;

  /** Keeps track of the current page path. */
  private _previousPath?: string;

  /** Keeps track of the elements and attributes that we've prefixed with the current path. */
  private _elementsWithExternalReferences?: Map<Element, { name: string, value: string }[]>;

  constructor(
    elementRef: ElementRef<HTMLElement>,
    private _iconRegistry: IconService,
    @Attribute('aria-hidden') ariaHidden: string,
    /**
     * @deprecated `location` parameter to be made required.
     * @breaking-change 8.0.0
     */
    @Optional() @Inject(SIM_ICON_LOCATION) private _location?: SimIconLocation) {
    super(elementRef);

    // If the user has not explicitly set aria-hidden, mark the icon as hidden, as this is
    // the right thing to do for the majority of icon use-cases.
    if (!ariaHidden) {
      elementRef.nativeElement.setAttribute('aria-hidden', 'true');
    }
    this._element = this._elementRef.nativeElement;
  }

  /**
   * Splits an svgIcon binding value into its icon set and icon name components.
   * Returns a 2-element array of [(icon set), (icon name)].
   * The separator for the two fields is ':'. If there is no separator, an empty
   * string is returned for the icon set and the entire value is returned for
   * the icon name. If the argument is falsy, returns an array of two empty strings.
   * Throws an error if the name contains two or more ':' separators.
   * Examples:
   *   `'social:cake' -> ['social', 'cake']
   *   'penguin' -> ['', 'penguin']
   *   null -> ['', '']
   *   'a:b:c' -> (throws Error)`
   */
  private _splitIconName(iconName: string): [string, string] {
    if (!iconName) {
      return ['', ''];
    }
    const parts = iconName.split(':');
    switch (parts.length) {
      case 1: return ['', parts[0]]; // 使用默认命名空间.
      case 2: return parts as [string, string];
      default: throw Error(`Invalid icon name: "${iconName}"`);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // 仅在输入更改时更新内联SVG图标，以避免不必要的DOM操作
    if (changes.svgIcon) {
      if (this.svgIcon) {
        const [namespace, iconName] = this._splitIconName(this.svgIcon);
        this._iconRegistry.getNamedSvgIcon(iconName, namespace).pipe(take(1)).subscribe(
          (svg: SVGElement) => this._setSvgElement(svg),
          (err: Error) => console.log(`Error retrieving icon: ${err.message}`)
        );
      } else {
        this._clearSvgElement();
      }
    }

    if (this._usingFontIcon()) {
      this._updateFontIconClasses();
    }
  }

  ngOnInit() {
    // Update font classes because ngOnChanges won't be called if none of the inputs are present,
    // e.g. <mat-icon>arrow</mat-icon> In this case we need to add a CSS class for the default font.
    if (this._usingFontIcon()) {
      this._updateFontIconClasses();
    }
  }

  ngAfterViewChecked() {
    const cachedElements = this._elementsWithExternalReferences;

    if (cachedElements && this._location && cachedElements.size) {
      const newPath = this._location.getPathname();

      // We need to check whether the URL has changed on each change detection since
      // the browser doesn't have an API that will let us react on link clicks and
      // we can't depend on the Angular router. The references need to be updated,
      // because while most browsers don't care whether the URL is correct after
      // the first render, Safari will break if the user navigates to a different
      // page and the SVG isn't re-rendered.
      if (newPath !== this._previousPath) {
        this._previousPath = newPath;
        this._prependPathToReferences(newPath);
      }
    }
  }

  ngOnDestroy() {
    if (this._elementsWithExternalReferences) {
      this._elementsWithExternalReferences.clear();
    }
  }

  private _usingFontIcon(): boolean {
    return !this.svgIcon;
  }

  private _setSvgElement(svg: SVGElement) {
    this._clearSvgElement();

    // Workaround for IE11 and Edge ignoring `style` tags inside dynamically-created SVGs.
    // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10898469/
    // Do this before inserting the element into the DOM, in order to avoid a style recalculation.
    const styleTags = svg.querySelectorAll('style') as NodeListOf<HTMLStyleElement>;

    for (let i = 0; i < styleTags.length; i++) {
      styleTags[i].textContent += ' ';
    }

    // Note: we do this fix here, rather than the icon registry, because the
    // references have to point to the URL at the time that the icon was created.
    if (this._location) {
      const path = this._location.getPathname();
      this._previousPath = path;
      this._cacheChildrenWithExternalReferences(svg);
      this._prependPathToReferences(path);
    }

    this._elementRef.nativeElement.appendChild(svg);
  }

  private _clearSvgElement() {
    const layoutElement: HTMLElement = this._elementRef.nativeElement;
    let childCount = layoutElement.childNodes.length;

    if (this._elementsWithExternalReferences) {
      this._elementsWithExternalReferences.clear();
    }

    // Remove existing non-element child nodes and SVGs, and add the new SVG element. Note that
    // we can't use innerHTML, because IE will throw if the element has a data binding.
    while (childCount--) {
      const child = layoutElement.childNodes[childCount];

      // 1 corresponds to Node.ELEMENT_NODE. We remove all non-element nodes in order to get rid
      // of any loose text nodes, as well as any SVG elements in order to remove any old icons.
      if (child.nodeType !== 1 || child.nodeName.toLowerCase() === 'svg') {
        layoutElement.removeChild(child);
      }
    }
  }

  private _updateFontIconClasses() {
    if (!this._usingFontIcon()) {
      return;
    }

    const elem: HTMLElement = this._elementRef.nativeElement;
    const fontSetClass = this.fontSet ?
      this._iconRegistry.classNameForFontAlias(this.fontSet) :
      this._iconRegistry.getDefaultFontSetClass();

    if (fontSetClass !== this._previousFontSetClass) {
      if (this._previousFontSetClass) {
        elem.classList.remove(this._previousFontSetClass);
      }
      if (fontSetClass) {
        elem.classList.add(fontSetClass);
      }
      this._previousFontSetClass = fontSetClass;
    }

    if (this.fontIcon !== this._previousFontIconClass) {
      if (this._previousFontIconClass) {
        elem.classList.remove(this._previousFontIconClass);
      }
      if (this.fontIcon) {
        elem.classList.add(this.fontIcon);
      }
      this._previousFontIconClass = this.fontIcon;
    }
  }

  /**
   * Cleans up a value to be used as a fontIcon or fontSet.
   * Since the value ends up being assigned as a CSS class, we
   * have to trim the value and omit space-separated values.
   */
  private _cleanupFontValue(value: string) {
    return typeof value === 'string' ? value.trim().split(' ')[0] : value;
  }

  /**
   * Prepends the current path to all elements that have an attribute pointing to a `FuncIRI`
   * reference. This is required because WebKit browsers require references to be prefixed with
   * the current path, if the page has a `base` tag.
   */
  private _prependPathToReferences(path: string) {
    const elements = this._elementsWithExternalReferences;

    if (elements) {
      elements.forEach((attrs, element) => {
        attrs.forEach(attr => {
          element.setAttribute(attr.name, `url('${path}#${attr.value}')`);
        });
      });
    }
  }

  /**
   * Caches the children of an SVG element that have `url()`
   * references that we need to prefix with the current path.
   */
  private _cacheChildrenWithExternalReferences(element: SVGElement) {
    const elementsWithFuncIri = element.querySelectorAll(funcIriAttributeSelector);
    const elements = this._elementsWithExternalReferences =
      this._elementsWithExternalReferences || new Map();

    for (let i = 0; i < elementsWithFuncIri.length; i++) {
      funcIriAttributes.forEach(attr => {
        const elementWithReference = elementsWithFuncIri[i];
        const value = elementWithReference.getAttribute(attr);
        const match = value ? value.match(funcIriPattern) : null;

        if (match) {
          let attributes = elements.get(elementWithReference);

          if (!attributes) {
            attributes = [];
            elements.set(elementWithReference, attributes);
          }

          attributes.push({ name: attr, value: match[1] });
        }
      });
    }
  }

}
