const StyleDictionary = require("style-dictionary").extend("./config.json");
const tinycolor = require("tinycolor2");

// increase the lightness by 10%
// tinycolor represents the percent as a decimal between 0 and 1)
// for example: hsl(262, 100%, 68%) is represented as { h: 262, s: 1, l: .68 } 
const OFFSET = 0.1;

// the new color properties to replace the original ones
// recall, the original ones are in `design-tokens.json`
let shades = {};

// round to the highest range
// for example: .62 rounds to .70
function roundUp(num, offset = OFFSET) {
  return Math.ceil(num / offset) / 10;
}

// since tinycolor represents the percent as a decimal, translate the decimal to the percentage
function asPercent(num) {
  return num * 100;
}

// appends the shade percentage to the key
// for example: primary + { h: 262, s: 1, l: .68 } becomes primary-70
function asShadeKey(key, lightness) {
  return `${key}-${asPercent(roundUp(lightness))}`;
}

// convert the object representing the hsl back into a string
// for example: { h: 262, s: 1, l: .68 } becomes hsl(262, 100%, 68%)  
function asHslString(ratio) {
  return tinycolor.fromRatio(ratio).toHslString();
}

// add a new color property for the generated shade
function cloneShade({ hsl, key, lightness, prop }) {
  const shadeKey = asShadeKey(key, lightness);
  shades[shadeKey] = {
    ...prop,
    value: asHslString({ ...hsl, l: lightness }),
  };
}

// the original color properties
const colorProps = Object.entries(
  StyleDictionary.properties.color.background.page
);

for (const [key, prop] of colorProps) {
  // convert any color into a hsl object 
  const hsl = tinycolor(prop.value).toHsl();

  // extract the original lightness before we manipulate it
  const { l: originalLightness } = hsl;
  let lightness = originalLightness;

  // add a property for the original shade
  cloneShade({ hsl, lightness, key, prop });

  // add a property for a lighter shade (higher lightness percentage)
  // until another lighter shade would go above 99%
  while (lightness + OFFSET < 1) {
    lightness = lightness + OFFSET;
    cloneShade({ hsl, lightness, key, prop });
  }

  
  // reset lightness to original value
  lightness = originalLightness;

  // add a property for a darker shade (lower lightness percentage)
  // until another darker shade would go below 1%
  while (lightness - OFFSET > 0) {
    lightness = lightness - OFFSET;
    cloneShade({ hsl, lightness, key, prop });
  }
}

// replace the original color properties with all the new shade properties
StyleDictionary.properties.color.background.page = shades;

// build our dictionary for all platforms as specified in the config
// this is the equivalent of: style-dictionary build
// when using the CLI
StyleDictionary.buildAllPlatforms();
