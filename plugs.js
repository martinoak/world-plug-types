// Plug type descriptions and simple SVG drawings of each plug face.
const PLUG_TYPES = {
  A: { desc: "Two flat parallel pins, ungrounded.", where: "North & Central America, Japan" },
  B: { desc: "Two flat parallel pins plus a round grounding pin.", where: "North & Central America, Japan" },
  C: { desc: "Two round pins, ungrounded (the Europlug).", where: "Europe, Asia, Africa, South America" },
  D: { desc: "Three large round pins in a triangle.", where: "India, Nepal, parts of Africa" },
  E: { desc: "Two round pins plus a hole for the socket's grounding pin.", where: "France, Belgium, Poland, Czechia, Slovakia" },
  F: { desc: "Two round pins with grounding clips on the sides (Schuko).", where: "Germany and most of Europe, Russia" },
  G: { desc: "Three rectangular pins in a triangle, fused plug.", where: "UK, Ireland, Gulf states, Singapore, Malaysia" },
  H: { desc: "Three pins in a Y shape.", where: "Israel, Palestine" },
  I: { desc: "Two flat pins in a V shape plus a grounding pin.", where: "Australia, New Zealand, China, Argentina" },
  J: { desc: "Three round pins, the middle one offset.", where: "Switzerland, Liechtenstein, Rwanda" },
  K: { desc: "Two round pins plus a half-round grounding pin.", where: "Denmark, Greenland" },
  L: { desc: "Three round pins in a straight line.", where: "Italy, Chile" },
  M: { desc: "Three large round pins in a triangle (bigger than D).", where: "South Africa, Lesotho, Eswatini" },
  N: { desc: "Three round pins in a compact hexagonal plug.", where: "Brazil, South Africa" },
  O: { desc: "Two round pins plus a round grounding pin below.", where: "Thailand" },
};

const PLUG_SHAPES = (() => {
  const pin = (x, y, r = 2.8) => `<circle class="pin" cx="${x}" cy="${y}" r="${r}"/>`;
  const blade = (x, y, w, h, rot = 0) =>
    `<rect class="pin" x="${x - w / 2}" y="${y - h / 2}" width="${w}" height="${h}" rx="0.8" transform="rotate(${rot} ${x} ${y})"/>`;
  const circle = `<circle class="face" cx="24" cy="24" r="20"/>`;
  const rect = (x, y, w, h, r) => `<rect class="face" x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const poly = (pts) => `<polygon class="face" points="${pts}" stroke-linejoin="round"/>`;

  return {
    A: rect(8, 9, 32, 30, 7) + blade(17, 24, 3.5, 13) + blade(31, 24, 3.5, 13),
    B: rect(8, 6, 32, 36, 7) + blade(17, 19, 3.5, 12) + blade(31, 19, 3.5, 12) + pin(24, 34, 3.2),
    C: rect(4, 14, 40, 20, 10) + pin(16, 24, 2.6) + pin(32, 24, 2.6),
    D: circle + pin(24, 13, 3.8) + pin(15, 30, 3) + pin(33, 30, 3),
    E: circle + pin(15, 26) + pin(33, 26) + `<circle class="hole" cx="24" cy="12" r="3"/>`,
    F: circle + pin(15, 24) + pin(33, 24) +
      `<rect class="pin" x="21" y="3" width="6" height="4" rx="1"/><rect class="pin" x="21" y="41" width="6" height="4" rx="1"/>`,
    G: rect(6, 6, 36, 36, 4) + blade(24, 15, 4.5, 11) + blade(14, 32, 11, 4.5) + blade(34, 32, 11, 4.5),
    H: circle + blade(16, 18, 3.5, 11, -30) + blade(32, 18, 3.5, 11, 30) + blade(24, 34, 3.5, 10),
    I: rect(6, 6, 36, 36, 8) + blade(16, 19, 3.5, 12, 30) + blade(32, 19, 3.5, 12, -30) + blade(24, 34, 3.5, 10),
    J: poly("10,12 38,12 44,24 38,36 10,36 4,24") + pin(13, 21, 2.5) + pin(35, 21, 2.5) + pin(24, 28, 2.5),
    K: circle + pin(15, 20) + pin(33, 20) + `<path class="pin" d="M19.5 30 h9 v1 a4.5 4.5 0 0 1 -9 0 z"/>`,
    L: rect(4, 15, 40, 18, 9) + pin(13, 24, 2.5) + pin(24, 24, 2.5) + pin(35, 24, 2.5),
    M: circle + pin(24, 12, 4.6) + pin(14, 31, 3.8) + pin(34, 31, 3.8),
    N: poly("24,5 41,14 41,34 24,43 7,34 7,14") + pin(17, 20, 2.4) + pin(31, 20, 2.4) + pin(24, 29, 2.4),
    O: circle + pin(16, 19, 2.6) + pin(32, 19, 2.6) + pin(24, 32, 2.8),
  };
})();

function plugIcon(type, size = 28) {
  return `<svg class="plug-icon" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">${PLUG_SHAPES[type] || ""}</svg>`;
}
