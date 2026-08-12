import React, { useEffect, useState } from "react";
import bwipjs from "bwip-js";
import QRCode from "qrcode";
import { resolveElementValue, interpolate } from "./elementUtils";

/**
 * BarcodeElement
 * --------------
 * Renders the barcode as an <img> carrying a data URL produced by the same
 * bwip-js engine used everywhere else. Unlike a <canvas>, the data URL
 * survives `cloneNode` (Browser Print), `outerHTML` (SVG export) and
 * html-to-image (PNG/JPEG/PDF) — so the barcode looks identical in the
 * designer, print preview, browser print and every export.
 *
 * The human-readable text is rendered in HTML below/above the bars so the
 * new "Barcode Text Gap" (px, 0–30) is fully controllable and pixel-exact.
 */
function BarcodeElement({ el, data, settings }) {
  const [src, setSrc] = useState("");
  const [renderError, setRenderError] = useState("");
  const value = resolveElementValue(el, data, settings) || "";

  useEffect(() => {
    if (!value) {
      setSrc("");
      setRenderError("");
      return;
    }
    let cancelled = false;
    const options = {
      bcid: el.bcid || "code128",
      text: value,
      scale: Math.max(1, Math.round(Number(el.scale) || 2)),
      height: Math.max(6, Number(el.heightmm) || 10),
      includetext: false,
      paddingwidth: Number(el.padding) || 0,
      paddingheight: Number(el.padding) || 0,
      backgroundcolor: (el.backgroundcolor || el.bg || "#ffffff").replace(
        "#",
        "",
      ),
      barcolor: (el.barcolor || el.color || "#000000").replace("#", ""),
    };
    const canvas = document.createElement("canvas");
    try {
      bwipjs.toCanvas(canvas, options);
      if (!cancelled) {
        setSrc(canvas.toDataURL("image/png"));
        setRenderError("");
      }
    } catch (err) {
      console.error("[Barcode] Code128 render failed:", err, options);
      if (!cancelled) {
        setSrc("");
        setRenderError(
          "Invalid barcode value. Only letters, digits and basic symbols are allowed.",
        );
      }
    }
    return () => {
      cancelled = true;
    };
  }, [
    value,
    el.bcid,
    el.heightmm,
    el.scale,
    el.padding,
    el.backgroundcolor,
    el.barcolor,
    el.bg,
    el.color,
  ]);

  const includeText = el.includeText !== false;
  const textPos = el.textPosition || "bottom";
  const gap = Math.min(30, Math.max(0, Number(el.textGap) || 0));
  const fontSize = Number(el.fontsize) || 6;
  const textColor = el.textcolor || "#000000";
  const bg = el.backgroundcolor || "#ffffff";
  // Field-name display for barcode: if this barcode is bound to a field
  // (has a fieldKey) and "Show Field Name" is enabled, render
  // "Display Label : value" as the human-readable text.
  const isField = !!el.fieldKey;
  const showLabel = isField && el.showLabel !== false;
  const displayLabel = el.displayLabel || (isField ? el.fieldKey : "");
  const humanText = showLabel ? `${displayLabel} : ${value}` : value;
  const textStyle = {
    fontSize: `${fontSize}px`,
    color: textColor,
    fontFamily: "monospace",
    textAlign: "center",
    whiteSpace: "nowrap",
    lineHeight: 1.1,
    flexShrink: 0,
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: textPos === "top" ? "column-reverse" : "column",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {includeText && textPos === "top" && (
        <div style={{ ...textStyle, marginBottom: gap }}>{humanText}</div>
      )}
      {src ? (
        <img
          src={src}
          alt={value}
          style={{
            width: "100%",
            maxWidth: "100%",
            height: "auto",
            maxHeight: includeText
              ? `calc(100% - ${fontSize + gap}px)`
              : "100%",
            objectFit: "contain",
            flex: 1,
            display: "block",
            minHeight: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: renderError ? "#ff3b30" : "#8e8e93",
            fontSize: "7px",
            fontFamily: "sans-serif",
            textAlign: "center",
            padding: "2px",
            boxSizing: "border-box",
          }}
        >
          {renderError || "Enter Barcode Value"}
        </div>
      )}
      {includeText && textPos === "bottom" && (
        <div style={{ ...textStyle, marginTop: gap }}>{humanText}</div>
      )}
    </div>
  );
}

function QrElement({ el, data, settings }) {
  const [src, setSrc] = useState("");
  const value = resolveElementValue(el, data, settings) || "";

  useEffect(() => {
    if (!value) {
      setSrc("");
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(value, {
      errorCorrectionLevel: el.errorLevel || "M",
      width: 256,
      margin: 0,
      color: { dark: el.color || "#000000", light: el.bg || "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setSrc(url);
      })
      .catch(() => {
        if (!cancelled) setSrc("");
      });
    return () => {
      cancelled = true;
    };
  }, [value, el.errorLevel, el.color, el.bg]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: el.bg || "#ffffff",
      }}
    >
      {src ? (
        <img
          src={src}
          alt="QR"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      ) : (
        <span style={{ color: "#ff3b30", fontSize: "8px" }}>
          {value ? "QR Error" : "—"}
        </span>
      )}
    </div>
  );
}

function TextElement({ el, data, settings }) {
  const value = resolveElementValue(el, data, settings);

  // Field-bound elements (created by the palette / createFieldElement) get
  // label-aware rendering. Model is value-only; other fields show an
  // editable, toggleable display label that never changes the data key.
  const isFieldElement = !!el.fieldKey && el.displayLabel !== undefined;

  if (isFieldElement) {
    const showLabel = el.showLabel !== false && !el.valueOnly;
    const displayLabel = el.displayLabel || el.fieldKey;
    const gap = Math.min(60, Math.max(0, Number(el.labelGap) || 0));
    // Independent colon spacing (Space Before/After Colon in px). Uses real
    // CSS margins so spacing is pixel-exact and never manual characters.
    const spaceBeforeColon = Math.min(
      20,
      Math.max(0, Number(el.spaceBeforeColon) || 0),
    );
    const spaceAfterColon = Math.min(
      20,
      Math.max(0, Number(el.spaceAfterColon) || 0),
    );

    const labelStyle = {
      color: el.labelColor || "#6e6e73",
      fontFamily: el.labelFontFamily || "Arial",
      fontSize: `${el.labelFontSize || 7}px`,
      fontWeight: el.labelFontWeight || (el.labelBold ? "700" : "400"),
      fontStyle: el.labelItalic ? "italic" : "normal",
      textDecoration: el.labelUnderline ? "underline" : "none",
      whiteSpace: "pre",
      flexShrink: 0,
    };
    // Value uses its OWN fontSize / lineHeight / letterSpacing (independent
    // from the field name). This makes value size fully controllable.
    const valueStyle = {
      color: el.color || el.valueColor || "#1c1c1e",
      fontFamily: el.fontFamily || el.valueFontFamily || "Arial",
      fontSize: `${el.fontSize || el.valueFontSize || 7}px`,
      fontWeight:
        el.fontWeight || el.valueFontWeight || (el.bold ? "700" : "400"),
      fontStyle:
        el.italic || el.valueFontStyle === "italic" ? "italic" : "normal",
      textDecoration: el.underline ? "underline" : "none",
      lineHeight: el.lineHeight || el.valueLineHeight || 1.15,
      letterSpacing:
        el.letterSpacing != null
          ? `${el.letterSpacing}px`
          : el.valueLetterSpacing != null
            ? `${el.valueLetterSpacing}px`
            : undefined,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      flexShrink: 1,
      minWidth: 0,
    };

    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          textAlign: el.align || "left",
          justifyContent:
            el.align === "center"
              ? "center"
              : el.align === "right"
                ? "flex-end"
                : "flex-start",
          lineHeight: 1.15,
          overflow: "hidden",
          padding: `${el.paddingY || 0}px ${el.paddingX || 0}px`,
          boxSizing: "border-box",
        }}
      >
        {showLabel && (
          <>
            <span style={labelStyle}>{displayLabel}</span>
            <span
              style={{
                color: labelStyle.color,
                fontFamily: labelStyle.fontFamily,
                fontSize: labelStyle.fontSize,
                fontWeight: labelStyle.fontWeight,
                fontStyle: labelStyle.fontStyle,
                marginLeft: `${spaceBeforeColon}px`,
                marginRight: `${spaceAfterColon}px`,
                whiteSpace: "pre",
                flexShrink: 0,
              }}
            >
              :
            </span>
          </>
        )}
        <span
          style={{
            ...valueStyle,
            marginLeft: showLabel ? `${gap}px` : undefined,
          }}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        fontSize: `${el.fontSize || 7}px`,
        fontWeight: el.fontWeight || (el.bold ? "700" : "400"),
        fontStyle: el.italic ? "italic" : "normal",
        textDecoration: el.underline ? "underline" : "none",
        color: el.color || "#1c1c1e",
        textAlign: el.align || "left",
        fontFamily: el.fontFamily || "Arial",
        lineHeight: el.lineHeight || 1.15,
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : undefined,
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        display: "flex",
        alignItems: "center",
        padding: `${el.paddingY || 0}px ${el.paddingX || 0}px`,
        marginTop: el.marginTop ? `${el.marginTop}px` : undefined,
        marginBottom: el.marginBottom ? `${el.marginBottom}px` : undefined,
        background:
          el.background && el.background !== "#ffffff00"
            ? el.background
            : "transparent",
        border: el.borderWidth
          ? `${el.borderWidth}px solid ${el.borderColor || "#000000"}`
          : undefined,
        borderRadius: el.borderRadius ? `${el.borderRadius}px` : undefined,
        boxSizing: "border-box",
      }}
    >
      <span style={{ width: "100%" }}>{value}</span>
    </div>
  );
}

function ShapeElement({ el }) {
  const common = {
    width: "100%",
    height: "100%",
    boxSizing: "border-box",
  };
  if (el.type === "rectangle") {
    return (
      <div
        style={{
          ...common,
          background: el.fill || "transparent",
          border: `${el.strokeWidth || 0.5}px solid ${el.stroke || "#1c1c1e"}`,
          borderRadius: `${el.radius || 0}px`,
        }}
      />
    );
  }
  if (el.type === "circle") {
    return (
      <div
        style={{
          ...common,
          background: el.fill || "transparent",
          border: `${el.strokeWidth || 0.5}px solid ${el.stroke || "#1c1c1e"}`,
          borderRadius: "50%",
        }}
      />
    );
  }
  if (el.type === "line") {
    return (
      <div
        style={{
          ...common,
          borderTop: `${el.strokeWidth || 0.5}px ${el.lineStyle || "solid"} ${el.stroke || "#1c1c1e"}`,
        }}
      />
    );
  }
  return null;
}

function ImageElement({ el, data, settings }) {
  const src = interpolate(el.src || "", data, settings);
  if (!src) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f2f2f7",
          border: "1px dashed #c7c7cc",
          color: "#8e8e93",
          fontSize: "6px",
          textAlign: "center",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {el.type === "logo" ? "LOGO" : "IMG"}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      style={{
        width: "100%",
        height: "100%",
        objectFit: el.fit || "contain",
        display: "block",
      }}
    />
  );
}

function resolveZIndex(elements, el) {
  return elements.indexOf(el);
}

export function ElementRenderer({
  el,
  data,
  settings,
  selected,
  onSelect,
  elements,
}) {
  if (el.hidden) return null;

  const style = {
    position: "absolute",
    left: `${el.x}mm`,
    top: `${el.y}mm`,
    width: `${el.width}mm`,
    height: `${el.height}mm`,
    transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
    opacity: el.opacity !== undefined ? el.opacity / 100 : 1,
    cursor: el.locked ? "default" : "move",
    zIndex: elements ? resolveZIndex(elements, el) + 1 : 5,
  };

  let content = null;
  switch (el.type) {
    case "text":
      content = <TextElement el={el} data={data} settings={settings} />;
      break;
    case "barcode":
      content = <BarcodeElement el={el} data={data} settings={settings} />;
      break;
    case "qr":
      content = <QrElement el={el} data={data} settings={settings} />;
      break;
    case "rectangle":
    case "circle":
    case "line":
      content = <ShapeElement el={el} />;
      break;
    case "image":
    case "logo":
      content = <ImageElement el={el} data={data} settings={settings} />;
      break;
    case "date":
    case "time":
      content = <TextElement el={el} data={data} settings={settings} />;
      break;
    default:
      content = null;
  }

  return (
    <div
      style={style}
      onMouseDown={(e) => {
        e.stopPropagation();
        if (!el.locked) onSelect?.(el.id);
      }}
      className={selected ? "ring-2 ring-accent-500" : ""}
      data-element-id={el.id}
    >
      {content}
      {selected && !el.locked && (
        <>
          <div
            className="resize-handle"
            style={{ top: -4, left: -4 }}
            data-handle="nw"
          />
          <div
            className="resize-handle"
            style={{ top: -4, right: -4 }}
            data-handle="ne"
          />
          <div
            className="resize-handle"
            style={{ bottom: -4, left: -4 }}
            data-handle="sw"
          />
          <div
            className="resize-handle"
            style={{ bottom: -4, right: -4 }}
            data-handle="se"
          />
          <div className="rotate-handle" />
        </>
      )}
    </div>
  );
}
