// Layered vector art. Geometry is built once; animation only transforms the rig.
const PotatoArt = {
  ink: 0x202733,
  palettes: {
    WELL_ROUNDED: [0x4b9985, 0xf4c976],
    WARRIOR: [0x677d91, 0xde795c],
    RANGER: [0x46856e, 0xbee398],
    MAGE: [0x7860ac, 0xe2b9ff],
    THIEF: [0x45516c, 0xa9b3dd],
    ENGINEER: [0xcf9654, 0x8de2db],
    DOCTOR: [0xe2e9dd, 0x62cbb2],
    BERSERKER: [0x9d594b, 0xffb374],
  },
  shape(parent, draw) {
    const g = new PIXI.Graphics();
    draw(g);
    parent.addChild(g);
    return g;
  },
  ellipse(g, x, y, w, h, color, outline = true) {
    g.lineStyle(outline ? 1.8 : 0, this.ink, 1);
    g.beginFill(color);
    g.drawEllipse(x, y, w, h);
    g.endFill();
    g.lineStyle(0);
  },
  rect(g, x, y, w, h, color, radius = 3) {
    g.lineStyle(1.8, this.ink);
    g.beginFill(color);
    g.drawRoundedRect(x, y, w, h, radius);
    g.endFill();
    g.lineStyle(0);
  },
  polygon(g, points, color) {
    g.lineStyle(1.8, this.ink);
    g.beginFill(color);
    g.drawPolygon(points);
    g.endFill();
    g.lineStyle(0);
  },
  create(id = "WELL_ROUNDED", size = 24) {
    const root = new PIXI.Container(),
      model = new PIXI.Container();
    model.scale.set(size / 24);
    root.addChild(model);
    const [cloth, accent] = this.palettes[id] || this.palettes.WELL_ROUNDED;
    const shadow = this.shape(model, (g) => {
      g.beginFill(0x0b171d, 0.28);
      g.drawEllipse(0, 23, 25, 8);
      g.endFill();
    });
    const leftFoot = this.shape(model, (g) => {
      this.rect(g, -8, -4, 15, 11, 0x3e4650, 5);
      this.rect(g, -8, 3, 16, 4, 0x202733, 2);
    });
    const rightFoot = this.shape(model, (g) => {
      this.rect(g, -7, -4, 15, 11, 0x3e4650, 5);
      this.rect(g, -7, 3, 16, 4, 0x202733, 2);
    });
    leftFoot.position.set(-11, 20);
    rightFoot.position.set(11, 20);
    const torso = new PIXI.Container();
    model.addChild(torso);
    const cape = this.shape(torso, (g) => {
      this.polygon(g, [-18, -6, -25, 18, 0, 23, 25, 18, 18, -6], cloth);
      g.beginFill(0x0d202b, 0.15);
      g.drawPolygon([-18, -6, -25, 18, -13, 19]);
      g.endFill();
    });
    cape.visible = ["MAGE", "RANGER", "THIEF"].includes(id);
    const hand = this.shape(torso, (g) => {
      this.ellipse(g, -23, 9, 6, 8, 0xd6a16b);
    });
    this.shape(torso, (g) => {
      this.ellipse(g, 0, -2, 22, 25, 0xc98b58);
      this.ellipse(g, -2, -5, 19, 22, 0xe8b77a, false);
      this.ellipse(g, -8, -15, 9, 6, 0xf5d49b, false);
      [
        [-16, -8, 2],
        [-17, 4, 1.4],
        [14, -14, 1.5],
        [17, 2, 2],
        [-10, 11, 1.4],
      ].forEach(([x, y, r]) =>
        this.ellipse(g, x, y, r, r * 0.7, 0xc58a54, false),
      );
      this.rect(g, -18, 9, 36, 12, cloth, 6);
      this.rect(g, -18, 16, 36, 5, 0x57463b, 2);
      this.rect(g, -4, 15, 8, 7, accent, 2);
    });
    // Scarf: a distinct silhouette and a small secondary-motion attachment.
    const scarf = this.shape(torso, (g) => {
      this.polygon(g, [-14, 6, -25, 14, -16, 18, -7, 7], accent);
      this.rect(g, -20, 4, 40, 6, accent, 3);
    });
    const eyes = new PIXI.Container();
    eyes.y = -6;
    torso.addChild(eyes);
    const pupils = [];
    this.shape(eyes, (g) => {
      this.ellipse(g, -8, 0, 5.2, 7.2, 0xfff4dc);
      this.ellipse(g, 8, 0, 5.2, 7.2, 0xfff4dc);
    });
    for (const x of [-8, 8])
      pupils.push(
        this.shape(eyes, (g) => {
          this.ellipse(g, x, 1, 2.7, 4.2, 0x27323d, false);
          this.ellipse(g, x - 0.7, -0.5, 1, 1.4, 0xffffff, false);
        }),
      );
    this.shape(torso, (g) => {
      this.ellipse(g, 0, 0, 3.7, 2.5, 0xd39760, false);
      g.lineStyle(1.6, this.ink);
      g.moveTo(-4, 2);
      g.quadraticCurveTo(0, 6, 4, 2);
      g.lineStyle(0);
    });
    const gear = this.shape(torso, (g) => {
      if (id === "WARRIOR") {
        this.polygon(
          g,
          [-22, -13, -19, -26, -8, -32, 11, -30, 21, -21, 23, -12],
          cloth,
        );
        this.rect(g, -23, -16, 46, 6, 0x9eafbe, 2);
        this.rect(g, -2, -29, 5, 24, 0xb9c7cb, 2);
        this.polygon(g, [-10, -31, -6, -42, 4, -40, 9, -30], accent);
        this.rect(g, -25, 6, 12, 13, cloth, 4);
        this.rect(g, 13, 6, 12, 13, cloth, 4);
      } else if (id === "RANGER") {
        this.polygon(g, [-25, -12, -18, -29, 8, -34, 24, -13], cloth);
        this.polygon(g, [9, -26, 15, -43, 21, -41, 16, -25], accent);
        this.rect(g, -24, -15, 48, 5, 0x315b50, 3);
      } else if (id === "MAGE") {
        this.polygon(g, [-18, -21, -1, -49, 12, -40, 16, -20], cloth);
        this.ellipse(g, 0, -19, 28, 6, cloth);
        this.rect(g, -14, -26, 28, 5, accent, 1);
        this.ellipse(g, 4, -36, 2, 2, 0xffe5a2, false);
      } else if (id === "THIEF") {
        this.polygon(g, [-24, -12, -17, -29, 3, -34, 23, -21, 24, -12], cloth);
        this.rect(g, -21, -1, 42, 9, 0x354055, 4);
        g.lineStyle(1, accent, 0.8);
        g.moveTo(12, 1);
        g.lineTo(19, 1);
        g.lineStyle(0);
      } else if (id === "ENGINEER") {
        this.rect(g, -22, -29, 44, 13, cloth, 7);
        this.rect(g, -25, -20, 50, 5, 0xf0c275, 2);
        for (const x of [-9, 9]) {
          this.rect(g, x - 7, -12, 14, 12, 0x4b5965, 4);
          this.ellipse(g, x, -6, 4.5, 4.3, accent, false);
        }
        this.rect(g, -3, -8, 6, 3, 0x36424d, 1);
      } else if (id === "DOCTOR") {
        this.rect(g, -19, -29, 38, 14, cloth, 6);
        this.rect(g, -21, -18, 42, 4, 0xb9cfc5, 2);
        this.ellipse(g, 0, -23, 5, 5, accent, false);
        g.lineStyle(1.6, 0xffffff);
        g.moveTo(-3, -23);
        g.lineTo(3, -23);
        g.moveTo(0, -26);
        g.lineTo(0, -20);
        g.lineStyle(0);
        this.rect(g, 10, 10, 6, 6, accent, 1);
      } else if (id === "BERSERKER") {
        this.polygon(g, [-21, -14, -28, -31, -16, -25, -10, -18], 0xe5d0ac);
        this.polygon(g, [21, -14, 28, -31, 16, -25, 10, -18], 0xe5d0ac);
        this.rect(g, -23, -21, 46, 7, cloth, 3);
        g.lineStyle(2.5, 0x794239);
        g.moveTo(-15, -15);
        g.lineTo(-3, -11);
        g.moveTo(15, -15);
        g.lineTo(3, -11);
        g.moveTo(14, -5);
        g.lineTo(11, 3);
        g.lineStyle(0);
      } else {
        this.rect(g, -21, -26, 42, 11, cloth, 5);
        this.rect(g, -23, -18, 46, 5, 0x6db39b, 3);
        this.ellipse(g, 0, -21, 3, 3, accent, false);
      }
    });
    return {
      root,
      model,
      shadow,
      torso,
      leftFoot,
      rightFoot,
      hand,
      scarf,
      eyes,
      pupils,
      gear,
    };
  },
  pose(rig, time, motion, phase, look, hit = 0) {
    const step = Math.sin(phase),
      hop = Math.abs(Math.cos(phase)) * 2.8 * motion;
    rig.torso.y = -hop + Math.sin(time * 2.6) * 0.55 * (1 - motion);
    rig.torso.rotation = step * 0.055 * motion + look * 0.025;
    rig.torso.scale.set(
      1 + hit * 0.1,
      1 - hit * 0.1 + Math.sin(phase * 2) * 0.025 * motion,
    );
    rig.leftFoot.y = 20 + step * 3.5 * motion;
    rig.rightFoot.y = 20 - step * 3.5 * motion;
    rig.leftFoot.rotation = step * 0.16 * motion;
    rig.rightFoot.rotation = -step * 0.16 * motion;
    rig.scarf.rotation = -step * 0.045 * motion;
    rig.hand.y = -step * 1.6 * motion;
    rig.shadow.scale.set(1 - hop * 0.018, 1 - hop * 0.012);
    rig.pupils.forEach((p) => (p.x = look * 1.6));
    rig.torso.x = look * 1.1;
  },
  portrait(renderer, id) {
    const rig = this.create(id, 44);
    rig.root.position.set(64, 87);
    const stage = new PIXI.Container();
    stage.addChild(rig.root);
    const texture = renderer.generateTexture(stage, {
      region: new PIXI.Rectangle(0, 0, 128, 144),
      resolution: 1.5,
    });
    const url = renderer.extract.canvas(texture).toDataURL("image/png");
    texture.destroy(true);
    stage.destroy({ children: true });
    return url;
  },
};
