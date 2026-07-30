/* @ds-bundle: {"format":4,"namespace":"TilliDeckDesignSystem_4928e3","components":[{"name":"CheckList","sourcePath":"components/content/CheckList.jsx"},{"name":"CheckItem","sourcePath":"components/content/CheckList.jsx"},{"name":"HighlightText","sourcePath":"components/content/HighlightText.jsx"},{"name":"IconCircle","sourcePath":"components/content/IconCircle.jsx"},{"name":"OutlineCard","sourcePath":"components/content/OutlineCard.jsx"},{"name":"PlainCard","sourcePath":"components/content/OutlineCard.jsx"},{"name":"Pill","sourcePath":"components/content/Pill.jsx"},{"name":"PriceCard","sourcePath":"components/content/PriceCard.jsx"},{"name":"QuoteCard","sourcePath":"components/content/QuoteCard.jsx"},{"name":"StoryBlock","sourcePath":"components/content/QuoteCard.jsx"},{"name":"StepCard","sourcePath":"components/content/StepCard.jsx"},{"name":"NumberedStep","sourcePath":"components/content/StepCard.jsx"},{"name":"AwardStrip","sourcePath":"components/data/AwardStrip.jsx"},{"name":"DataTable","sourcePath":"components/data/DataTable.jsx"},{"name":"DonutStat","sourcePath":"components/data/DonutStat.jsx"},{"name":"StatChip","sourcePath":"components/data/StatChip.jsx"},{"name":"StatBlock","sourcePath":"components/data/StatChip.jsx"},{"name":"PhotoFrame","sourcePath":"components/media/PhotoFrame.jsx"},{"name":"PhoneFrame","sourcePath":"components/media/PhotoFrame.jsx"},{"name":"AssessmentPanel","sourcePath":"components/slide/AssessmentPanel.jsx"},{"name":"PanelSection","sourcePath":"components/slide/AssessmentPanel.jsx"},{"name":"Brush","sourcePath":"components/slide/Brush.jsx"},{"name":"SkillTags","sourcePath":"components/slide/CoverSlide.jsx"},{"name":"CoverSlide","sourcePath":"components/slide/CoverSlide.jsx"},{"name":"DividerSlide","sourcePath":"components/slide/DividerSlide.jsx"},{"name":"Eyebrow","sourcePath":"components/slide/Eyebrow.jsx"},{"name":"LogoLockup","sourcePath":"components/slide/LogoLockup.jsx"},{"name":"PartnerLogos","sourcePath":"components/slide/LogoLockup.jsx"},{"name":"Rail","sourcePath":"components/slide/Rail.jsx"},{"name":"SectionLabel","sourcePath":"components/slide/SectionLabel.jsx"},{"name":"SlideFrame","sourcePath":"components/slide/SlideFrame.jsx"},{"name":"SlideTitle","sourcePath":"components/slide/SlideTitle.jsx"},{"name":"Accent","sourcePath":"components/slide/SlideTitle.jsx"}],"sourceHashes":{"components/content/CheckList.jsx":"796ed08d19f7","components/content/HighlightText.jsx":"95a30c668ddc","components/content/IconCircle.jsx":"26e5fa29cc9a","components/content/OutlineCard.jsx":"d42db9f6cb79","components/content/Pill.jsx":"76299a758cef","components/content/PriceCard.jsx":"0c6e6329afb7","components/content/QuoteCard.jsx":"547534f3880a","components/content/StepCard.jsx":"513946d9f4ef","components/data/AwardStrip.jsx":"8d4fb50b6fdf","components/data/DataTable.jsx":"42abe9800055","components/data/DonutStat.jsx":"5e35f2ebc3ea","components/data/StatChip.jsx":"8208f3fee045","components/media/PhotoFrame.jsx":"ebbc20bf319d","components/slide/AssessmentPanel.jsx":"5e951f29f8dd","components/slide/Brush.jsx":"6f78475f9bea","components/slide/CoverSlide.jsx":"9bfb16ff2006","components/slide/DividerSlide.jsx":"bcad6b643105","components/slide/Eyebrow.jsx":"8c7867994505","components/slide/LogoLockup.jsx":"92b63bc3f98a","components/slide/Rail.jsx":"1e0e5a79721f","components/slide/SectionLabel.jsx":"a16a28822e4e","components/slide/SlideFrame.jsx":"d638337e6491","components/slide/SlideTitle.jsx":"461ea8e98752"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TilliDeckDesignSystem_4928e3 = window.TilliDeckDesignSystem_4928e3 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/content/CheckList.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const A = typeof window !== 'undefined' && window.TILLI_ASSETS || 'assets';

/** Green-tick list: bold lead-in plus grey continuation, one row per promise. */
function CheckList({
  items = [],
  gap = 22,
  size = 27,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap,
      ...style
    }
  }, rest), items.map((it, i) => /*#__PURE__*/React.createElement(CheckItem, {
    key: i,
    title: it.title,
    size: size
  }, it.body)));
}

/** One row of a CheckList. */
function CheckItem({
  title,
  children,
  size = 27,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'flex-start',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: A + '/illustrations/check-green.png',
    alt: "",
    style: {
      width: size * 1.05,
      height: size * 1.05,
      marginTop: 4,
      flex: 'none',
      objectFit: 'contain'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: size,
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, title ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-title)'
    }
  }, title, children ? ' ' : '') : null, children ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--tl-text-secondary)'
    }
  }, children) : null));
}
Object.assign(__ds_scope, { CheckList, CheckItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/CheckList.jsx", error: String((e && e.message) || e) }); }

// components/content/HighlightText.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const C = {
  green: 'var(--tl-lime-400)',
  cyan: 'var(--tl-wash-cyan)',
  yellow: 'var(--tl-wash-yellow)',
  pink: 'var(--tl-wash-pink-strong)'
};

/** Marker-pen highlight behind a phrase — the closing-slide device ("Early insight is the most powerful intervention"). */
function HighlightText({
  children,
  color = 'green',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      background: C[color] || color,
      borderRadius: 'var(--tl-radius-sm)',
      padding: '0.06em 0.22em 0.14em',
      boxDecorationBreak: 'clone',
      WebkitBoxDecorationBreak: 'clone',
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { HighlightText });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/HighlightText.jsx", error: String((e && e.message) || e) }); }

// components/content/IconCircle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const A = typeof window !== 'undefined' && window.TILLI_ASSETS || 'assets';
const C = {
  pink: 'var(--tl-pink-600)',
  cyan: 'var(--tl-cyan-400)',
  green: 'var(--tl-green-400)',
  yellow: 'var(--tl-yellow-400)',
  orange: 'var(--tl-orange-500)'
};

/** Solid colour circle holding one white glyph from `assets/icons/`. */
function IconCircle({
  icon = 'book',
  color = 'pink',
  size = 84,
  glyphScale = 0.52,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: C[color] || color,
      display: 'grid',
      placeItems: 'center',
      flex: 'none',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: A + '/icons/' + icon + '.png',
    alt: "",
    style: {
      width: size * glyphScale,
      height: size * glyphScale,
      objectFit: 'contain'
    }
  }));
}
Object.assign(__ds_scope, { IconCircle });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/IconCircle.jsx", error: String((e && e.message) || e) }); }

// components/content/OutlineCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const C = {
  pink: 'var(--tl-pink-600)',
  cyan: 'var(--tl-cyan-400)',
  green: 'var(--tl-green-400)',
  yellow: 'var(--tl-yellow-400)',
  orange: 'var(--tl-orange-500)'
};

/** White card with a 2px accent border, an icon circle, a bold title and grey body. The workhorse card. */
function OutlineCard({
  icon,
  color = 'pink',
  title,
  children,
  footer,
  width,
  iconSize = 84,
  align = 'left',
  style,
  ...rest
}) {
  const accent = C[color] || color;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      background: 'var(--tl-surface-card)',
      border: 'var(--tl-border-width) solid ' + accent,
      borderRadius: 'var(--tl-radius-lg)',
      padding: 32,
      width,
      alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.IconCircle, {
    icon: icon,
    color: color,
    size: iconSize
  }) : null, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-title)',
      lineHeight: 1.15
    }
  }, title) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 25,
      color: 'var(--tl-text-secondary)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, children) : null, footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 'auto',
      paddingTop: 8
    }
  }, footer) : null);
}

/** Same card without the coloured outline — hairline border, for dense grids. */
function PlainCard({
  title,
  children,
  width,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      background: 'var(--tl-surface-card)',
      border: '1px solid var(--tl-border-subtle)',
      borderRadius: 'var(--tl-radius-md)',
      padding: 26,
      boxShadow: 'var(--tl-shadow-card)',
      width,
      ...style
    }
  }, rest), title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-title)'
    }
  }, title) : null, children ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 23,
      color: 'var(--tl-text-secondary)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, children) : null);
}
Object.assign(__ds_scope, { OutlineCard, PlainCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/OutlineCard.jsx", error: String((e && e.message) || e) }); }

// components/content/Pill.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SOLID = {
  pink: 'var(--tl-pink-600)',
  cyan: 'var(--tl-cyan-500)',
  green: 'var(--tl-green-500)',
  yellow: 'var(--tl-yellow-500)',
  orange: 'var(--tl-orange-500)'
};
const TINT = {
  pink: 'var(--tl-wash-pink-strong)',
  cyan: 'var(--tl-wash-cyan)',
  green: 'var(--tl-wash-green)',
  yellow: 'var(--tl-wash-yellow-soft)',
  orange: 'var(--tl-wash-yellow-soft)'
};
const INK = {
  pink: 'var(--tl-pink-600)',
  cyan: 'var(--tl-cyan-700)',
  green: 'var(--tl-green-600)',
  yellow: 'var(--tl-orange-500)',
  orange: 'var(--tl-orange-500)'
};

/** Rounded label: outlined (report types), tinted (categories) or solid (proof lines inside cards). */
function Pill({
  children,
  color = 'cyan',
  variant = 'outline',
  size = 25,
  style,
  ...rest
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontSize: size,
    fontWeight: 'var(--tl-weight-bold)',
    borderRadius: 'var(--tl-radius-pill)',
    padding: '8px 22px',
    lineHeight: 1.2,
    whiteSpace: 'nowrap'
  };
  const skin = variant === 'solid' ? {
    background: SOLID[color] || color,
    color: 'var(--tl-white)'
  } : variant === 'tint' ? {
    background: TINT[color] || color,
    color: INK[color] || color
  } : {
    background: 'var(--tl-white)',
    color: INK[color] || color,
    border: 'var(--tl-border-width) solid ' + (SOLID[color] || color)
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      ...base,
      ...skin,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Pill });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/Pill.jsx", error: String((e && e.message) || e) }); }

// components/content/PriceCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Pricing tier card. The recommended tier gets a yellow wash, yellow border and a MOST POPULAR tab. */
function PriceCard({
  name,
  note,
  price,
  unit = '/student/yr',
  features = [],
  featured = false,
  width = 340,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
      width,
      padding: '34px 28px 30px',
      borderRadius: 'var(--tl-radius-md)',
      background: featured ? 'var(--tl-wash-yellow-soft)' : 'var(--tl-surface-card)',
      border: featured ? 'var(--tl-border-width) solid var(--tl-yellow-500)' : '1px solid var(--tl-border-subtle)',
      ...style
    }
  }, rest), featured ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: -19,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'var(--tl-yellow-500)',
      color: 'var(--tl-white)',
      fontSize: 19,
      fontWeight: 'var(--tl-weight-bold)',
      letterSpacing: 'var(--tl-tracking-wide)',
      padding: '6px 20px',
      borderRadius: 'var(--tl-radius-sm)',
      whiteSpace: 'nowrap'
    }
  }, "MOST POPULAR") : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 31,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-title)'
    }
  }, name), note ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontStyle: 'italic',
      color: 'var(--tl-text-muted)'
    }
  }, note) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'baseline',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 40,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-heading)'
    }
  }, price), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 21,
      color: 'var(--tl-text-secondary)'
    }
  }, unit)), /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0,
      paddingLeft: 22,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      fontSize: 21,
      color: 'var(--tl-text-secondary)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, features.map((f, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, f))));
}
Object.assign(__ds_scope, { PriceCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/PriceCard.jsx", error: String((e && e.message) || e) }); }

// components/content/QuoteCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const A = typeof window !== 'undefined' && window.TILLI_ASSETS || 'assets';
const TINT = {
  green: 'var(--tl-wash-green)',
  cyan: 'var(--tl-wash-cyan)',
  pink: 'var(--tl-wash-pink)',
  yellow: 'var(--tl-wash-yellow-soft)'
};
const MARK = {
  green: 'quote-green',
  cyan: 'quote-cyan',
  pink: 'quote-pink',
  yellow: 'quote-pink'
};
const NAME = {
  green: 'var(--tl-green-600)',
  cyan: 'var(--tl-cyan-700)',
  pink: 'var(--tl-pink-600)',
  yellow: 'var(--tl-orange-500)'
};

/** Tinted testimonial card with an oversized coloured quote mark and a coloured attribution line. */
function QuoteCard({
  children,
  attribution,
  color = 'green',
  width,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      background: TINT[color] || color,
      borderRadius: 'var(--tl-radius-md)',
      padding: '28px 32px',
      width,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: A + '/illustrations/' + (MARK[color] || 'quote-green') + '.png',
    alt: "",
    style: {
      width: 56,
      height: 'auto'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontStyle: 'italic',
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-title)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, children), attribution ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 'var(--tl-weight-bold)',
      color: NAME[color] || color
    }
  }, attribution) : null);
}

/** The paired story block: small coloured eyebrow, big headline number, grey explanation. */
function StoryBlock({
  eyebrow,
  headline,
  children,
  color = 'orange',
  width,
  style,
  ...rest
}) {
  const c = {
    orange: 'var(--tl-orange-500)',
    green: 'var(--tl-green-500)',
    cyan: 'var(--tl-cyan-500)',
    pink: 'var(--tl-pink-600)'
  }[color] || color;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      width,
      ...style
    }
  }, rest), eyebrow ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 21,
      fontWeight: 'var(--tl-weight-bold)',
      letterSpacing: 'var(--tl-tracking-wide)',
      textTransform: 'uppercase',
      color: c
    }
  }, eyebrow) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-heading)',
      letterSpacing: 'var(--tl-tracking-tight)'
    }
  }, headline), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 23,
      color: 'var(--tl-text-secondary)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, children));
}
Object.assign(__ds_scope, { QuoteCard, StoryBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/QuoteCard.jsx", error: String((e && e.message) || e) }); }

// components/content/StepCard.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const C = {
  pink: 'var(--tl-pink-600)',
  cyan: 'var(--tl-cyan-400)',
  green: 'var(--tl-green-400)',
  yellow: 'var(--tl-yellow-400)',
  orange: 'var(--tl-orange-500)'
};

/** Numbered step card — "01 Measure" with an icon circle in the corner and a solid proof pill at the foot. */
function StepCard({
  number,
  title,
  children,
  footer,
  icon,
  color = 'pink',
  width = 460,
  style,
  ...rest
}) {
  const accent = C[color] || color;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      background: 'var(--tl-surface-card)',
      border: 'var(--tl-border-width) solid ' + accent,
      borderRadius: 'var(--tl-radius-lg)',
      padding: '32px 32px 28px',
      width,
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement(__ds_scope.IconCircle, {
    icon: icon,
    color: color,
    size: 72,
    style: {
      position: 'absolute',
      right: -20,
      top: -20
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 44,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-heading)',
      letterSpacing: 'var(--tl-tracking-tight)'
    }
  }, number), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-title)'
    }
  }, title), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 25,
      color: 'var(--tl-text-secondary)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, children), footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, footer) : null);
}

/** Inline numbered step: green outlined circle, bold lead-in, grey continuation. */
function NumberedStep({
  n,
  title,
  children,
  color = 'var(--tl-green-500)',
  size = 27,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap: 18,
      alignItems: 'flex-start',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: size * 1.6,
      height: size * 1.6,
      borderRadius: '50%',
      border: '3px solid ' + color,
      color,
      fontWeight: 'var(--tl-weight-bold)',
      fontSize: size * 0.85,
      display: 'grid',
      placeItems: 'center',
      flex: 'none'
    }
  }, n), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: size,
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-title)'
    }
  }, title, children ? ' ' : ''), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--tl-text-secondary)'
    }
  }, children)));
}
Object.assign(__ds_scope, { StepCard, NumberedStep });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/content/StepCard.jsx", error: String((e && e.message) || e) }); }

// components/data/AwardStrip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Centred single line of award and recognition names, separated by middots. */
function AwardStrip({
  items = [],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: '0 18px',
      fontSize: 21,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-secondary)',
      letterSpacing: 'var(--tl-tracking-wide)',
      ...style
    }
  }, rest), items.map((it, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--tl-text-muted)'
    }
  }, "\xB7") : null, /*#__PURE__*/React.createElement("span", null, it))));
}
Object.assign(__ds_scope, { AwardStrip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/AwardStrip.jsx", error: String((e && e.message) || e) }); }

// components/data/DataTable.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const HEAD = {
  cyan: 'var(--tl-cyan-500)',
  pink: 'var(--tl-pink-300)',
  yellow: 'var(--tl-yellow-500)',
  green: 'var(--tl-green-500)'
};

/** The workload table: one accent-coloured header cell per column, hairline grid, generous cells. */
function DataTable({
  columns = [],
  rows = [],
  headColors = ['cyan', 'pink', 'yellow', 'green'],
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("table", _extends({
    style: {
      borderCollapse: 'separate',
      borderSpacing: 0,
      width: '100%',
      fontSize: 25,
      color: 'var(--tl-text-body)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, columns.map((c, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      background: HEAD[headColors[i % headColors.length]],
      color: 'var(--tl-white)',
      fontWeight: 'var(--tl-weight-bold)',
      fontSize: 23,
      letterSpacing: 'var(--tl-tracking-wide)',
      textTransform: 'uppercase',
      padding: '14px 20px',
      textAlign: i === 0 ? 'left' : 'center',
      border: '1px solid var(--tl-white)'
    }
  }, c)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri
  }, r.map((cell, ci) => /*#__PURE__*/React.createElement("td", {
    key: ci,
    style: {
      padding: '14px 20px',
      textAlign: ci === 0 ? 'left' : 'center',
      fontWeight: ci === 0 ? 'var(--tl-weight-semibold)' : 'var(--tl-weight-medium)',
      background: ri % 2 ? 'var(--tl-surface-100)' : 'var(--tl-white)',
      border: '1px solid var(--tl-line-200)'
    }
  }, cell))))));
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/data/DonutStat.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const C = {
  pink: 'var(--tl-pink-600)',
  green: 'var(--tl-green-500)',
  cyan: 'var(--tl-cyan-500)',
  yellow: 'var(--tl-yellow-500)',
  orange: 'var(--tl-orange-500)'
};

/** Thick ring showing one percentage, with the figure inside and a caption below. */
function DonutStat({
  value = 0,
  label,
  color = 'pink',
  size = 260,
  thickness = 46,
  style,
  ...rest
}) {
  const fg = C[color] || color;
  const pct = Math.max(0, Math.min(100, value));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 24,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: size,
      height: size,
      borderRadius: '50%',
      background: 'conic-gradient(' + fg + ' ' + pct + '%, var(--tl-line-200) 0)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: size - thickness * 2,
      height: size - thickness * 2,
      borderRadius: '50%',
      background: 'var(--tl-white)',
      display: 'grid',
      placeItems: 'center'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * 0.26,
      fontWeight: 'var(--tl-weight-bold)',
      color: fg,
      letterSpacing: 'var(--tl-tracking-tight)'
    }
  }, pct + '%'))), label ? /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: size + 80,
      textAlign: 'center',
      fontSize: 23,
      color: 'var(--tl-text-stat-label)'
    }
  }, label) : null);
}
Object.assign(__ds_scope, { DonutStat });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/DonutStat.jsx", error: String((e && e.message) || e) }); }

// components/data/StatChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const C = {
  pink: {
    fg: 'var(--tl-pink-600)',
    bg: 'var(--tl-wash-pink)'
  },
  green: {
    fg: 'var(--tl-green-500)',
    bg: 'var(--tl-wash-green)'
  },
  cyan: {
    fg: 'var(--tl-cyan-400)',
    bg: 'var(--tl-wash-cyan)'
  },
  yellow: {
    fg: 'var(--tl-yellow-500)',
    bg: 'var(--tl-wash-yellow-soft)'
  },
  orange: {
    fg: 'var(--tl-orange-500)',
    bg: 'var(--tl-wash-yellow-soft)'
  },
  grey: {
    fg: 'var(--tl-cyan-400)',
    bg: 'var(--tl-surface-100)'
  }
};

/** Oversized coloured numeral + grey explanatory label, on a tinted rounded slab. */
function StatChip({
  value,
  children,
  color = 'pink',
  size = 68,
  tint = true,
  width,
  style,
  ...rest
}) {
  const c = C[color] || C.pink;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      background: tint ? c.bg : 'transparent',
      borderRadius: 'var(--tl-radius-md)',
      padding: tint ? '24px 32px' : 0,
      width,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: size,
      fontWeight: 'var(--tl-weight-bold)',
      color: c.fg,
      lineHeight: 1,
      letterSpacing: 'var(--tl-tracking-tight)',
      flex: 'none'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 25,
      fontWeight: 'var(--tl-weight-medium)',
      color: 'var(--tl-text-stat-label)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, children));
}

/** Stacked variant: numeral above, label below — the four-across proof row. */
function StatBlock({
  value,
  children,
  color = 'pink',
  size = 68,
  align = 'center',
  style,
  ...rest
}) {
  const c = C[color] || C.pink;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      textAlign: align,
      gap: 10,
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: size,
      fontWeight: 'var(--tl-weight-bold)',
      color: c.fg,
      lineHeight: 1,
      letterSpacing: 'var(--tl-tracking-tight)'
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 23,
      fontWeight: 'var(--tl-weight-medium)',
      color: 'var(--tl-text-stat-label)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, children));
}
Object.assign(__ds_scope, { StatChip, StatBlock });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/data/StatChip.jsx", error: String((e && e.message) || e) }); }

// components/media/PhotoFrame.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Rounded photo card — the only photo treatment in the deck. */
function PhotoFrame({
  src,
  alt = '',
  width,
  height,
  radius = 24,
  fit = 'cover',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width,
      height,
      borderRadius: radius,
      overflow: 'hidden',
      background: 'var(--tl-surface-150)',
      flex: 'none',
      ...style
    }
  }, rest), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit: fit,
      display: 'block'
    }
  }) : null);
}

/** Product screenshot in a phone body — black shell for product UI, cyan shell for Ask-Tilli chats. */
function PhoneFrame({
  src,
  alt = '',
  children,
  width = 300,
  shell = 'cyan',
  style,
  ...rest
}) {
  const border = shell === 'cyan' ? 'var(--tl-cyan-500)' : shell === 'black' ? 'var(--tl-ink-900)' : shell;
  const h = width * 2.05;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      width,
      height: h,
      borderRadius: width * 0.14,
      background: border,
      padding: width * 0.035,
      flex: 'none',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: '100%',
      height: '100%',
      borderRadius: width * 0.11,
      background: 'var(--tl-white)',
      overflow: 'hidden',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: width * 0.045,
      left: '50%',
      transform: 'translateX(-50%)',
      width: width * 0.3,
      height: width * 0.045,
      borderRadius: 'var(--tl-radius-pill)',
      background: 'var(--tl-ink-900)'
    }
  }), src ? /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  }) : children));
}
Object.assign(__ds_scope, { PhotoFrame, PhoneFrame });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/media/PhotoFrame.jsx", error: String((e && e.message) || e) }); }

// components/slide/AssessmentPanel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * The assessment / detail slide layout: full-height cyan panel on the left with an italic pill and a
 * white title, content on the white right-hand side.
 */
function AssessmentPanel({
  label,
  title,
  art,
  children,
  panelWidth = 500,
  color = 'var(--tl-cyan-500)',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: 1920,
      height: 1080,
      flex: 'none',
      overflow: 'hidden',
      background: 'var(--tl-white)',
      fontFamily: 'var(--tl-font-core)',
      display: 'flex',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      width: panelWidth,
      flex: 'none',
      background: color,
      padding: '48px 44px',
      display: 'flex',
      flexDirection: 'column',
      gap: 24
    }
  }, label ? /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: 'flex-start',
      background: 'var(--tl-white)',
      color: 'var(--tl-cyan-700)',
      fontStyle: 'italic',
      fontWeight: 'var(--tl-weight-bold)',
      fontSize: 25,
      padding: '6px 18px',
      borderRadius: 'var(--tl-radius-sm)'
    }
  }, label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 54,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-white)',
      lineHeight: 1.08,
      letterSpacing: 'var(--tl-tracking-tight)'
    }
  }, title), art ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 12
    }
  }, art) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '48px 56px',
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
      minWidth: 0
    }
  }, children));
}

/** Small heading used inside an AssessmentPanel body: cyan bold line + content. */
function PanelSection({
  heading,
  children,
  color = 'var(--tl-cyan-500)',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontWeight: 'var(--tl-weight-bold)',
      color,
      marginBottom: 8
    }
  }, heading), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 25,
      color: 'var(--tl-text-body)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, children));
}
Object.assign(__ds_scope, { AssessmentPanel, PanelSection });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/AssessmentPanel.jsx", error: String((e && e.message) || e) }); }

// components/slide/Brush.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const A = typeof window !== 'undefined' && window.TILLI_ASSETS || 'assets';

/** The orange brush stroke that bleeds off a slide edge — the deck's one hand-made mark. */
function Brush({
  width = 300,
  corner = 'bottom-right',
  rotate,
  flip,
  style,
  ...rest
}) {
  const pos = {
    'bottom-right': {
      right: -30,
      bottom: 20
    },
    'bottom-left': {
      left: -20,
      bottom: 30
    },
    'top-right': {
      right: -20,
      top: 10
    },
    'top-left': {
      left: -30,
      top: 20
    }
  }[corner] || {};
  const r = rotate === undefined ? {
    'bottom-right': -20,
    'bottom-left': 200,
    'top-right': 150,
    'top-left': 20
  }[corner] : rotate;
  return /*#__PURE__*/React.createElement("img", _extends({
    src: A + '/illustrations/brush-orange.png',
    alt: "",
    style: {
      position: 'absolute',
      width,
      pointerEvents: 'none',
      transform: 'rotate(' + r + 'deg)' + (flip ? ' scaleX(-1)' : ''),
      ...pos,
      ...style
    }
  }, rest));
}
Object.assign(__ds_scope, { Brush });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/Brush.jsx", error: String((e && e.message) || e) }); }

// components/slide/DividerSlide.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const A = typeof window !== 'undefined' && window.TILLI_ASSETS || 'assets';
const BG = {
  green: 'var(--tl-green-500)',
  yellow: 'var(--tl-yellow-500)',
  cyan: 'var(--tl-cyan-500)',
  pink: 'var(--tl-pink-600)'
};

/**
 * Full-bleed statement slide: one saturated colour, white ultra-bold sentence, orange brush strokes in the corners.
 */
function DividerSlide({
  children,
  color = 'green',
  kicker,
  brush = true,
  inset = 60,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: 1920,
      height: 1080,
      flex: 'none',
      overflow: 'hidden',
      background: 'var(--tl-white)',
      fontFamily: 'var(--tl-font-core)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: inset,
      background: BG[color] || color,
      borderRadius: 'var(--tl-radius-xl)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 160px'
    }
  }, kicker ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 36,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-white)',
      marginBottom: 18
    }
  }, kicker) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 96,
      fontWeight: 'var(--tl-weight-extrabold)',
      color: 'var(--tl-white)',
      lineHeight: 'var(--tl-leading-tight)',
      letterSpacing: 'var(--tl-tracking-tight)',
      textTransform: 'none'
    }
  }, children)), brush ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    src: A + '/illustrations/brush-orange.png',
    alt: "",
    style: {
      position: 'absolute',
      left: 20,
      bottom: 40,
      width: 260,
      transform: 'rotate(200deg)'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: A + '/illustrations/brush-orange.png',
    alt: "",
    style: {
      position: 'absolute',
      right: 40,
      bottom: 30,
      width: 300,
      transform: 'rotate(-20deg) scaleX(-1)'
    }
  })) : null);
}
Object.assign(__ds_scope, { DividerSlide });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/DividerSlide.jsx", error: String((e && e.message) || e) }); }

// components/slide/Eyebrow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const C = {
  green: 'var(--tl-green-500)',
  pink: 'var(--tl-pink-600)',
  cyan: 'var(--tl-cyan-500)',
  yellow: 'var(--tl-yellow-500)',
  orange: 'var(--tl-orange-500)',
  ink: 'var(--tl-text-title)'
};

/** Small coloured kicker that sits directly above a slide headline. */
function Eyebrow({
  children,
  color = 'green',
  size = 36,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      fontSize: size,
      fontWeight: 'var(--tl-weight-bold)',
      color: C[color] || color,
      lineHeight: 1.2,
      marginBottom: 16,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Eyebrow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/Eyebrow.jsx", error: String((e && e.message) || e) }); }

// components/slide/LogoLockup.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const A = typeof window !== 'undefined' && window.TILLI_ASSETS || 'assets';

/** Stanford GSE + tilli co-brand lockup used top-left on the cover and closing slides. */
function LogoLockup({
  height = 76,
  gap = 40,
  tilliOnly = false,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap,
      ...style
    }
  }, rest), tilliOnly ? null : /*#__PURE__*/React.createElement("img", {
    src: A + '/logos/stanford-gse.png',
    alt: "Stanford Graduate School of Education",
    style: {
      height,
      width: 'auto'
    }
  }), /*#__PURE__*/React.createElement("img", {
    src: A + '/logos/tilli-wordmark.png',
    alt: "Tilli",
    style: {
      height: height * 0.72,
      width: 'auto'
    }
  }));
}

/** Row of partner / funder logos (Stanford, UNICEF Innovation, Stanford Accelerator for Learning, Stanford HAI). */
function PartnerLogos({
  logos = ['stanford-university', 'unicef-innovation', 'stanford-accelerator-for-learning', 'stanford-hai'],
  height = 64,
  gap = 56,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      alignItems: 'center',
      gap,
      ...style
    }
  }, rest), logos.map(l => /*#__PURE__*/React.createElement("img", {
    key: l,
    src: A + '/logos/' + l + '.png',
    alt: l,
    style: {
      height,
      width: 'auto'
    }
  })));
}
Object.assign(__ds_scope, { LogoLockup, PartnerLogos });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/LogoLockup.jsx", error: String((e && e.message) || e) }); }

// components/slide/Rail.jsx
try { (() => {
const RAIL = ['var(--tl-rail-1)', 'var(--tl-rail-2)', 'var(--tl-rail-3)', 'var(--tl-rail-4)'];

/** The left-edge colour rail that appears on every Tilli slide. */
function Rail({
  variant = 'content',
  style
}) {
  const cover = variant === 'cover';
  const w = cover ? 43 : 19;
  if (cover) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: w,
        display: 'flex',
        flexDirection: 'column',
        ...style
      }
    }, [RAIL[0], RAIL[1], RAIL[3], RAIL[2]].map((c, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        flex: 1,
        background: c
      }
    })));
  }
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: w,
      display: 'flex',
      flexDirection: 'column',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      background: RAIL[0]
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 64,
      background: RAIL[1]
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 64,
      background: RAIL[2]
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 64,
      background: RAIL[3]
    }
  }));
}
Object.assign(__ds_scope, { Rail });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/Rail.jsx", error: String((e && e.message) || e) }); }

// components/slide/CoverSlide.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const SKILLS = [{
  label: 'Emotional Strength',
  color: 'var(--tl-skill-emotional-strength)'
}, {
  label: 'Focus & Self-Control',
  color: 'var(--tl-skill-focus-self-control)'
}, {
  label: 'Resilience',
  color: 'var(--tl-skill-resilience)'
}, {
  label: 'Independent Thinking',
  color: 'var(--tl-skill-independent-thinking)'
}];

/** The four named skill families, set in their own colours above the cover title. */
function SkillTags({
  items = SKILLS,
  size = 24,
  gap = 56,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: 'flex',
      gap,
      ...style
    }
  }, rest), items.map((s, i) => /*#__PURE__*/React.createElement("span", {
    key: i,
    style: {
      fontSize: size,
      fontWeight: 'var(--tl-weight-bold)',
      color: s.color
    }
  }, s.label)));
}

/**
 * The deck cover: four-quarter rail, co-brand lockup, huge two-line title, one-line promise,
 * a slot for the partner organisation's logo and the contact email bottom-right.
 * @startingPoint section="Slides" subtitle="Tilli deck cover slide" viewport="1920x1080"
 */
function CoverSlide({
  title,
  subtitle,
  skills = SKILLS,
  partner = 'Partner Organization Logo',
  email = 'kavindya@tillikids.com',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: 1920,
      height: 1080,
      flex: 'none',
      overflow: 'hidden',
      background: 'var(--tl-white)',
      fontFamily: 'var(--tl-font-core)',
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement(__ds_scope.Rail, {
    variant: "cover"
  }), /*#__PURE__*/React.createElement(__ds_scope.LogoLockup, {
    height: 90,
    style: {
      position: 'absolute',
      left: 122,
      top: 34
    }
  }), /*#__PURE__*/React.createElement(SkillTags, {
    items: skills,
    style: {
      position: 'absolute',
      left: 129,
      top: 288
    }
  }), /*#__PURE__*/React.createElement("h1", {
    style: {
      position: 'absolute',
      left: 122,
      top: 340,
      margin: 0,
      width: 1560,
      fontSize: 185,
      fontWeight: 'var(--tl-weight-bold)',
      letterSpacing: 'var(--tl-tracking-hero)',
      lineHeight: 'var(--tl-leading-tight)',
      color: 'var(--tl-text-heading)'
    }
  }, title), subtitle ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 122,
      top: 690,
      width: 1100,
      fontSize: 37,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-secondary)',
      lineHeight: 'var(--tl-leading-normal)'
    }
  }, subtitle) : null, partner ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      left: 129,
      top: 896,
      width: 420,
      fontSize: 31,
      fontWeight: 'var(--tl-weight-bold)',
      color: 'var(--tl-text-secondary)'
    }
  }, partner) : null, email ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      right: 40,
      bottom: 54,
      fontSize: 23,
      letterSpacing: '0.02em',
      color: 'var(--tl-text-heading)'
    }
  }, email) : null);
}
Object.assign(__ds_scope, { SkillTags, CoverSlide });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/CoverSlide.jsx", error: String((e && e.message) || e) }); }

// components/slide/SectionLabel.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Cyan section title with an italic strapline — MEASURE / ANALYZE / INTERVENE. */
function SectionLabel({
  children,
  subtitle,
  lead,
  color = 'var(--tl-cyan-500)',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 54,
      fontWeight: 'var(--tl-weight-bold)',
      color,
      letterSpacing: 'var(--tl-tracking-tight)',
      textTransform: 'uppercase',
      lineHeight: 1.05
    }
  }, children), subtitle ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontStyle: 'italic',
      fontWeight: 'var(--tl-weight-medium)',
      color: 'var(--tl-text-body)',
      marginTop: 10
    }
  }, subtitle) : null, lead ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 27,
      fontWeight: 'var(--tl-weight-medium)',
      color: 'var(--tl-text-body)',
      marginTop: 8
    }
  }, lead) : null);
}
Object.assign(__ds_scope, { SectionLabel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/SectionLabel.jsx", error: String((e && e.message) || e) }); }

// components/slide/SlideFrame.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function SlideFrame({
  children,
  background = 'var(--tl-surface-page)',
  rail = 'content',
  pad = true,
  scale = 1,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      position: 'relative',
      width: 1920,
      height: 1080,
      flex: 'none',
      overflow: 'hidden',
      background,
      fontFamily: 'var(--tl-font-core)',
      color: 'var(--tl-text-body)',
      fontWeight: 'var(--tl-weight-medium)',
      lineHeight: 'var(--tl-leading-normal)',
      transform: scale === 1 ? undefined : 'scale(' + scale + ')',
      transformOrigin: 'top left',
      ...style
    }
  }, rest), rail ? /*#__PURE__*/React.createElement(__ds_scope.Rail, {
    variant: rail === 'cover' ? 'cover' : 'content'
  }) : null, pad ? /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      padding: '55px 120px 55px 120px',
      display: 'flex',
      flexDirection: 'column'
    }
  }, children) : children);
}
Object.assign(__ds_scope, { SlideFrame });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/SlideFrame.jsx", error: String((e && e.message) || e) }); }

// components/slide/SlideTitle.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/** Slide headline. Montserrat Bold, tight tracking, near-black — colour the important phrase with `<Accent>` or `<HighlightText>`. */
function SlideTitle({
  children,
  size = 73,
  color = 'var(--tl-text-heading)',
  weight = 700,
  maxWidth,
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("h2", _extends({
    style: {
      margin: 0,
      fontSize: size,
      fontWeight: weight,
      color,
      lineHeight: 'var(--tl-leading-snug)',
      letterSpacing: 'var(--tl-tracking-tight)',
      maxWidth,
      ...style
    }
  }, rest), children);
}
const C = {
  green: 'var(--tl-green-500)',
  pink: 'var(--tl-pink-600)',
  cyan: 'var(--tl-cyan-500)',
  yellow: 'var(--tl-yellow-500)',
  orange: 'var(--tl-orange-500)'
};

/** Recolours one phrase inside a headline — the deck's main emphasis device. */
function Accent({
  children,
  color = 'cyan',
  style,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      color: C[color] || color,
      ...style
    }
  }, rest), children);
}
Object.assign(__ds_scope, { SlideTitle, Accent });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/slide/SlideTitle.jsx", error: String((e && e.message) || e) }); }

__ds_ns.CheckList = __ds_scope.CheckList;

__ds_ns.CheckItem = __ds_scope.CheckItem;

__ds_ns.HighlightText = __ds_scope.HighlightText;

__ds_ns.IconCircle = __ds_scope.IconCircle;

__ds_ns.OutlineCard = __ds_scope.OutlineCard;

__ds_ns.PlainCard = __ds_scope.PlainCard;

__ds_ns.Pill = __ds_scope.Pill;

__ds_ns.PriceCard = __ds_scope.PriceCard;

__ds_ns.QuoteCard = __ds_scope.QuoteCard;

__ds_ns.StoryBlock = __ds_scope.StoryBlock;

__ds_ns.StepCard = __ds_scope.StepCard;

__ds_ns.NumberedStep = __ds_scope.NumberedStep;

__ds_ns.AwardStrip = __ds_scope.AwardStrip;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.DonutStat = __ds_scope.DonutStat;

__ds_ns.StatChip = __ds_scope.StatChip;

__ds_ns.StatBlock = __ds_scope.StatBlock;

__ds_ns.PhotoFrame = __ds_scope.PhotoFrame;

__ds_ns.PhoneFrame = __ds_scope.PhoneFrame;

__ds_ns.AssessmentPanel = __ds_scope.AssessmentPanel;

__ds_ns.PanelSection = __ds_scope.PanelSection;

__ds_ns.Brush = __ds_scope.Brush;

__ds_ns.SkillTags = __ds_scope.SkillTags;

__ds_ns.CoverSlide = __ds_scope.CoverSlide;

__ds_ns.DividerSlide = __ds_scope.DividerSlide;

__ds_ns.Eyebrow = __ds_scope.Eyebrow;

__ds_ns.LogoLockup = __ds_scope.LogoLockup;

__ds_ns.PartnerLogos = __ds_scope.PartnerLogos;

__ds_ns.Rail = __ds_scope.Rail;

__ds_ns.SectionLabel = __ds_scope.SectionLabel;

__ds_ns.SlideFrame = __ds_scope.SlideFrame;

__ds_ns.SlideTitle = __ds_scope.SlideTitle;

__ds_ns.Accent = __ds_scope.Accent;

})();
