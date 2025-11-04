import * as ResizablePrimitive from "react-resizable-panels";
declare const ResizablePanelGroup: ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => import("react/jsx-runtime").JSX.Element;
declare const ResizablePanel: import("react").ForwardRefExoticComponent<Omit<import("react").HTMLAttributes<HTMLDivElement | HTMLElement | HTMLHeadingElement | HTMLSpanElement | HTMLParagraphElement | HTMLFormElement | HTMLImageElement | HTMLUListElement | HTMLLIElement | HTMLSelectElement | HTMLOptionElement | HTMLOptGroupElement | HTMLLabelElement | HTMLButtonElement | HTMLTitleElement | HTMLMetaElement | HTMLLinkElement | HTMLScriptElement | HTMLStyleElement | HTMLInputElement | HTMLPreElement | HTMLAnchorElement | HTMLObjectElement | HTMLDataElement | HTMLMapElement | HTMLBaseElement | HTMLQuoteElement | HTMLTimeElement | HTMLProgressElement | HTMLSourceElement | HTMLAreaElement | HTMLAudioElement | HTMLBodyElement | HTMLBRElement | HTMLCanvasElement | HTMLTableCaptionElement | HTMLTableColElement | HTMLDataListElement | HTMLModElement | HTMLDetailsElement | HTMLDialogElement | HTMLDListElement | HTMLEmbedElement | HTMLFieldSetElement | HTMLHeadElement | HTMLHRElement | HTMLHtmlElement | HTMLIFrameElement | HTMLLegendElement | HTMLMenuElement | HTMLMeterElement | HTMLOListElement | HTMLOutputElement | HTMLPictureElement | HTMLSlotElement | HTMLTableElement | HTMLTableSectionElement | HTMLTableCellElement | HTMLTemplateElement | HTMLTextAreaElement | HTMLTableRowElement | HTMLTrackElement | HTMLVideoElement>, "id" | "onResize"> & {
    className?: string | undefined;
    collapsedSize?: number | undefined;
    collapsible?: boolean | undefined;
    defaultSize?: number | undefined;
    id?: string | undefined;
    maxSize?: number | undefined;
    minSize?: number | undefined;
    onCollapse?: ResizablePrimitive.PanelOnCollapse | undefined;
    onExpand?: ResizablePrimitive.PanelOnExpand | undefined;
    onResize?: ResizablePrimitive.PanelOnResize | undefined;
    order?: number | undefined;
    style?: object | undefined;
    tagName?: keyof HTMLElementTagNameMap | undefined;
} & {
    children?: import("react").ReactNode;
} & import("react").RefAttributes<ResizablePrimitive.ImperativePanelHandle>>;
declare const ResizableHandle: ({ withHandle, className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
    withHandle?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
