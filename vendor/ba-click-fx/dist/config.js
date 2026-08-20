//#region src/overlay-compositing.js
var e = Object.freeze(["coverage", "visual-max"]), t = Object.freeze(["none", "bright-core"]);
function n(t) {
	return e.includes(t);
}
function r(e, t = "coverage") {
	return n(e) ? e : t;
}
function i(e) {
	return t.includes(e);
}
function a(e, t = "none") {
	return i(e) ? e : t;
}
//#endregion
//#region src/webgpu-hdr-presentation.js
var o = Object.freeze({
	peak: 3,
	brightness: 1,
	colorPreservation: 0,
	whiteCore: .6,
	whiteStart: 1,
	whiteEnd: 5
}), s = 1080, c = s / 2, l = c * .3078824, u = 1.0636684, d = "webgl2", f = /* @__PURE__ */ new Set([
	"canvas2d",
	"webgl2",
	"webgpu",
	"auto"
]), p = "webgl2", ee = /* @__PURE__ */ new Set([
	"auto",
	"software",
	"webgl2",
	"native"
]), te = /* @__PURE__ */ new Set(["dom", "manual"]), m = "scene", ne = /* @__PURE__ */ new Set(["scene", "browser-overlay"]), h = 250 / 255, g = "source-over", _ = /* @__PURE__ */ new Set([
	"source-over",
	"screen",
	"plus-lighter"
]), v = "dom-backdrop", re = /* @__PURE__ */ new Set([
	"dom-backdrop",
	"transparent-window",
	"native"
]), y = "coverage", b = "none", x = 2, S = 4, C = 32, w = 0, T = 15.99, E = 16, D = .01, O = .01, k = "#4ca7ff", A = "relative-oklch", ie = /* @__PURE__ */ new Set(["hue-only", "relative-oklch"]), ae = 1, j = Object.freeze({
	referenceHeight: s,
	rootDurationMs: 1e3,
	hit: {
		enabled: !1,
		lifetimeMs: 80,
		radius: 24,
		colorKeys: [
			[0, [
				255,
				255,
				255
			]],
			[.5, [
				180,
				220,
				255
			]],
			[1, [
				61,
				100,
				255
			]]
		],
		alphaKeys: [
			[0, 1],
			[.4, .8],
			[1, 0]
		]
	},
	flare: {
		enabled: !1,
		lifetimeMs: 150,
		radius: 36,
		rayCount: 6,
		colorKeys: [
			[0, [
				255,
				255,
				255
			]],
			[.3, [
				180,
				220,
				255
			]],
			[1, [
				61,
				100,
				255
			]]
		],
		alphaKeys: [
			[0, .7],
			[.5, .3],
			[1, 0]
		]
	},
	disk: {
		lifetimeMs: 200,
		radius: .12 * 2 * .5 * c,
		colorKeys: [[0, [
			255,
			255,
			255
		]], [.1205921, [
			.72 * 255,
			.84 * 255,
			255
		]]],
		alphaKeys: [
			[0, 1],
			[.1088273, 1],
			[1, 0]
		],
		sizeKeys: [
			[
				0,
				.32583582,
				2.4004734,
				2.4004734
			],
			[
				.21392822,
				.7159773,
				.9115745,
				.9115745
			],
			[
				1,
				1,
				0,
				0
			]
		],
		textureRadialEnergyKeys: [
			[0, 1],
			[.84, 1],
			[.88, 1],
			[.885, .127021063],
			[.89, .029392051],
			[.895, .010453372],
			[.9, .003970262],
			[.905, 231299e-9],
			[.91, 26848e-9],
			[.915, 2303e-9],
			[.92, 0],
			[1, 0]
		]
	},
	rings: {
		count: 2,
		lifetimeMs: 600,
		radiusMin: .12 * c * u,
		radiusMax: .14 * c * u,
		bandToOuterRadius: .0598573766034603,
		widthStart: 1,
		widthEnd: 1,
		angularVelocityMultiplier: 11.170107,
		angularVelocityMinKeys: [[.14903903, 1], [1, .45561826]],
		angularVelocityMaxKeys: [[.15865384, .79881656], [1, -.06509134]],
		rotationDirection: -1,
		hdrIntensity: 5.992157,
		colorKeys: [
			[.1117723, [
				255,
				255,
				255
			]],
			[.5000076, [
				.2971698 * 255,
				.6532865 * 255,
				255
			]],
			[1, [
				.2971698 * 255,
				.6532865 * 255,
				255
			]]
		],
		sizeKeys: [
			[
				.007209778,
				.42050898,
				2.4004734,
				2.4004734
			],
			[
				.21392822,
				.7159773,
				.9115745,
				.9115745
			],
			[
				1,
				1,
				0,
				0
			]
		],
		dissolveKeys: [
			[
				0,
				1,
				0,
				0
			],
			[
				.2,
				0,
				0,
				2.4249368
			],
			[
				1,
				1,
				.27735636,
				.27735636
			]
		],
		arcSamples: 96,
		radialSamples: 8,
		textureUvMin: .0005000000237487257,
		textureUvMax: .999500036239624,
		dissolveDirection: 1
	},
	shards: {
		hdrIntensity: 5.992157,
		roundness: 0,
		startColor: [
			.5377358,
			.5377358,
			.5377358
		],
		clickCount: 4,
		clickLifetimeMinMs: 600,
		clickLifetimeMaxMs: 700,
		clickRadius: .3 * l,
		clickSpeedMin: .3 * l,
		clickSpeedMax: .4 * l,
		trailLifetimeMinMs: 200,
		trailLifetimeMaxMs: 400,
		trailRadius: .15 * l,
		trailSpeedMin: .2 * l,
		trailSpeedMax: .3 * l,
		sizeMin: .1 * l,
		sizeMax: .2 * l,
		sizeKeys: [
			[
				0,
				0,
				0,
				0
			],
			[
				.15445095,
				1,
				0,
				0
			],
			[
				1,
				0,
				-2.1621501,
				-2.1621501
			]
		],
		textureFrames: [[
			[-.48046875, -.36328125],
			[.48046875, -.36328125],
			[0, .45703125]
		], [
			[0, -.45703125],
			[.48046875, .36328125],
			[-.48046875, .36328125]
		]],
		colorKeys: [
			[0, [
				255,
				255,
				255
			]],
			[.1823606, [
				255,
				255,
				255
			]],
			[.282353, [
				.3726415 * 255,
				.7731873 * 255,
				255
			]],
			[.4617685, [
				.37254903 * 255,
				.7725491 * 255,
				255
			]],
			[.6617685, [
				.3529412 * 255,
				.7294118 * 255,
				.9450981 * 255
			]],
			[.8264744, [
				.37254903 * 255,
				.7725491 * 255,
				255
			]],
			[1, [
				.37254903 * 255,
				.7725491 * 255,
				255
			]]
		],
		alphaKeys: [
			[0, 1],
			[.2882429, 1],
			[.3647059, 0],
			[.4705882, 1],
			[.5735256, 0],
			[.6676432, 1],
			[.7558862, 0],
			[.8529488, 1],
			[1, 1]
		],
		trailSpacing: c / 5,
		maxCount: 50
	},
	trail: {
		lifetimeMs: 300,
		geometryWidth: .005 * c,
		width: .005 * c,
		minVertexDistance: .01 * c,
		numCornerVertices: 4,
		numCapVertices: 1,
		outerGlowWidth: 9,
		trailOpacity: 1,
		gradient: [
			[0, [
				0,
				0,
				0
			]],
			[.5794156, [
				0,
				24.191827,
				72
			]],
			[.97941558, [
				0,
				99.598249,
				255
			]],
			[1, [
				0,
				99.598249,
				255
			]]
		],
		coverageLongitudinalKeys: [
			[0, 0],
			[.248532, 0],
			[.97941558, 1],
			[1, 1]
		],
		textureLongitudinalKeys: [
			[0, 0],
			[.248532, 0],
			[.311155, .002428251],
			[.373777, .021219072],
			[.436399, .068478133],
			[.499022, .144128269],
			[.561644, .462077113],
			[.624266, .672443723],
			[.686888, .791298368],
			[.749511, .930109875],
			[.812133, 1],
			[1, 1]
		],
		textureTransverseProfileKeys: [
			[0, [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			]],
			[.248532, [
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0,
				0
			]],
			[.311155, [
				1,
				1,
				.625,
				0,
				0,
				0,
				0,
				0,
				0
			]],
			[.373777, [
				1,
				1,
				.7167,
				.3534,
				.1144,
				0,
				0,
				0,
				0
			]],
			[.436399, [
				1,
				1,
				.7956,
				.5387,
				.283,
				.0757,
				0,
				0,
				0
			]],
			[.499022, [
				1,
				.9605,
				.8657,
				.6613,
				.4191,
				.1786,
				.0279,
				0,
				0
			]],
			[.561644, [
				1,
				1,
				.9277,
				.4599,
				.2906,
				.1564,
				.0591,
				.0013,
				.0026
			]],
			[.624266, [
				1,
				.9687,
				.9534,
				.8881,
				.6621,
				.2342,
				.1006,
				.0149,
				.0018
			]],
			[.686888, [
				1,
				.9804,
				.9515,
				.8952,
				.8188,
				.5912,
				.1858,
				.0382,
				.0019
			]],
			[.749511, [
				1,
				1,
				.9457,
				.9018,
				.8341,
				.723,
				.4968,
				.0699,
				.0016
			]],
			[.812133, [
				1,
				1,
				.9734,
				.9647,
				.9047,
				.7991,
				.6724,
				.1896,
				.0015
			]],
			[.874755, [
				1,
				1,
				1,
				1,
				.9734,
				.9301,
				.7991,
				.4022,
				.0015
			]],
			[.937378, [
				1,
				1,
				1,
				1,
				1,
				1,
				.9301,
				.5,
				.0015
			]],
			[1, [
				1,
				1,
				1,
				1,
				1,
				1,
				.9867,
				.591,
				.0015
			]]
		]
	},
	bloom: {
		threshold: 1,
		softKnee: 0,
		clamp: 65472,
		intensity: 1.7,
		diffusion: 7,
		resolutionScale: .5,
		emissionRange: 23.968628,
		diskEmission: 2,
		trailEmission: 23.968628,
		trailCoverageScale: 1,
		trailEmissionAlpha: 1,
		clickEmissionScale: 1,
		ringEmissionAlpha: 1,
		diskEmissionAlpha: 1,
		ringBlur: 80,
		ringAlpha: .35,
		diskBlur: 65,
		diskAlpha: .65,
		trailAlpha: .18
	}
}), oe = 2, se = Object.freeze({
	hit: 10,
	flare: 20,
	disk: 30,
	rings: 40,
	shards: 50,
	trail: 60,
	bloom: 70
}), ce = Object.freeze({
	"hit.enabled": 10,
	"hit.lifetimeMs": 20,
	"hit.radius": 30,
	"flare.enabled": 40,
	"flare.lifetimeMs": 50,
	"flare.radius": 60,
	"flare.rayCount": 70,
	"disk.lifetimeMs": 80,
	"disk.radius": 90,
	"rings.count": 100,
	"rings.lifetimeMs": 110,
	"rings.radiusMin": 120,
	"rings.radiusMax": 130,
	"rings.bandToOuterRadius": 140,
	"rings.widthStart": 150,
	"rings.widthEnd": 160,
	"rings.angularVelocityMultiplier": 170,
	"rings.rotationDirection": 180,
	"rings.hdrIntensity": 190,
	"rings.arcSamples": 200,
	"rings.radialSamples": 210,
	"rings.dissolveDirection": 220,
	"shards.hdrIntensity": 230,
	"shards.clickCount": 240,
	"shards.clickLifetimeMinMs": 250,
	"shards.clickLifetimeMaxMs": 260,
	"shards.clickRadius": 270,
	"shards.clickSpeedMin": 280,
	"shards.clickSpeedMax": 290,
	"shards.roundness": 295,
	"shards.trailLifetimeMinMs": 300,
	"shards.trailLifetimeMaxMs": 310,
	"shards.trailRadius": 320,
	"shards.trailSpeedMin": 330,
	"shards.trailSpeedMax": 340,
	"shards.sizeMin": 350,
	"shards.sizeMax": 360,
	"shards.trailSpacing": 370,
	"shards.maxCount": 380,
	"trail.lifetimeMs": 390,
	"trail.geometryWidth": 400,
	"trail.width": 410,
	"trail.minVertexDistance": 420,
	"trail.numCornerVertices": 430,
	"trail.numCapVertices": 440,
	"trail.outerGlowWidth": 450,
	"trail.trailOpacity": 460,
	"bloom.threshold": 470,
	"bloom.softKnee": 480,
	"bloom.clamp": 490,
	"bloom.intensity": 500,
	"bloom.diffusion": 510,
	"bloom.resolutionScale": 520,
	"bloom.emissionRange": 530,
	"bloom.diskEmission": 540,
	"bloom.trailEmission": 550,
	"bloom.trailCoverageScale": 560,
	"bloom.trailEmissionAlpha": 570,
	"bloom.clickEmissionScale": 580,
	"bloom.ringEmissionAlpha": 590,
	"bloom.diskEmissionAlpha": 600,
	"bloom.ringBlur": 610,
	"bloom.ringAlpha": 620,
	"bloom.diskBlur": 630,
	"bloom.diskAlpha": 640,
	"bloom.trailAlpha": 650
}), le = Object.freeze({
	"hit.lifetimeMs": [
		20,
		200,
		1
	],
	"hit.radius": [
		10,
		60,
		.01
	],
	"flare.lifetimeMs": [
		50,
		300,
		1
	],
	"flare.radius": [
		10,
		80,
		.01
	],
	"flare.rayCount": [
		3,
		12,
		1
	],
	"disk.lifetimeMs": [
		50,
		500,
		1
	],
	"disk.radius": [
		20,
		120,
		.01
	],
	"rings.count": [
		0,
		6,
		1
	],
	"rings.lifetimeMs": [
		50,
		2e3,
		1
	],
	"rings.radiusMin": [
		20,
		120,
		.01
	],
	"rings.radiusMax": [
		20,
		120,
		.01
	],
	"rings.bandToOuterRadius": [
		.01,
		.2,
		1e-4
	],
	"rings.widthStart": [
		.25,
		2,
		.01
	],
	"rings.widthEnd": [
		.25,
		2,
		.01
	],
	"rings.angularVelocityMultiplier": [
		1,
		30,
		.01
	],
	"rings.rotationDirection": [
		-1,
		1,
		2
	],
	"rings.hdrIntensity": [
		0,
		8,
		.01
	],
	"rings.arcSamples": [
		24,
		192,
		1
	],
	"rings.radialSamples": [
		2,
		16,
		1
	],
	"rings.dissolveDirection": [
		-1,
		1,
		2
	],
	"shards.hdrIntensity": [
		0,
		8,
		.01
	],
	"shards.clickCount": [
		0,
		12,
		1
	],
	"shards.clickLifetimeMinMs": [
		100,
		1e3,
		1
	],
	"shards.clickLifetimeMaxMs": [
		100,
		1e3,
		1
	],
	"shards.clickRadius": [
		0,
		200,
		.01
	],
	"shards.clickSpeedMin": [
		0,
		200,
		.01
	],
	"shards.clickSpeedMax": [
		0,
		200,
		.01
	],
	"shards.roundness": [
		0,
		1,
		.01
	],
	"shards.trailLifetimeMinMs": [
		50,
		500,
		1
	],
	"shards.trailLifetimeMaxMs": [
		50,
		500,
		1
	],
	"shards.trailRadius": [
		0,
		100,
		.01
	],
	"shards.trailSpeedMin": [
		0,
		150,
		.01
	],
	"shards.trailSpeedMax": [
		0,
		150,
		.01
	],
	"shards.sizeMin": [
		0,
		100,
		.01
	],
	"shards.sizeMax": [
		0,
		100,
		.01
	],
	"shards.trailSpacing": [
		10,
		500,
		.01
	],
	"shards.maxCount": [
		0,
		500,
		1
	],
	"trail.lifetimeMs": [
		50,
		2e3,
		1
	],
	"trail.geometryWidth": [
		1,
		8,
		.01
	],
	"trail.width": [
		1,
		25,
		.01
	],
	"trail.minVertexDistance": [
		1,
		20,
		.01
	],
	"trail.numCornerVertices": [
		0,
		12,
		1
	],
	"trail.numCapVertices": [
		0,
		6,
		1
	],
	"trail.outerGlowWidth": [
		1,
		40,
		.1
	],
	"trail.trailOpacity": [
		0,
		1,
		.01
	],
	"bloom.threshold": [
		0,
		5,
		.01
	],
	"bloom.softKnee": [
		0,
		1,
		.01
	],
	"bloom.clamp": [
		1,
		65504,
		1
	],
	"bloom.intensity": [
		0,
		2,
		.01
	],
	"bloom.diffusion": [
		0,
		10,
		.01
	],
	"bloom.resolutionScale": [
		.1,
		.75,
		.01
	],
	"bloom.emissionRange": [
		1,
		64,
		.01
	],
	"bloom.diskEmission": [
		0,
		8,
		.01
	],
	"bloom.trailEmission": [
		0,
		64,
		.01
	],
	"bloom.trailCoverageScale": [
		0,
		4,
		.01
	],
	"bloom.trailEmissionAlpha": [
		0,
		1,
		.01
	],
	"bloom.clickEmissionScale": [
		0,
		4,
		.01
	],
	"bloom.ringEmissionAlpha": [
		0,
		1,
		.01
	],
	"bloom.diskEmissionAlpha": [
		0,
		1,
		.01
	],
	"bloom.ringBlur": [
		0,
		200,
		.1
	],
	"bloom.ringAlpha": [
		0,
		1,
		.01
	],
	"bloom.diskBlur": [
		0,
		200,
		.1
	],
	"bloom.diskAlpha": [
		0,
		1,
		.01
	],
	"bloom.trailAlpha": [
		0,
		1,
		.01
	]
}), ue = Object.freeze({
	"rings.radiusMin": ["rings.radiusMax"],
	"rings.radiusMax": ["rings.radiusMin"],
	"rings.widthStart": ["rings.widthEnd"],
	"rings.widthEnd": ["rings.widthStart"],
	"shards.clickLifetimeMinMs": ["shards.clickLifetimeMaxMs"],
	"shards.clickLifetimeMaxMs": ["shards.clickLifetimeMinMs"],
	"shards.clickSpeedMin": ["shards.clickSpeedMax"],
	"shards.clickSpeedMax": ["shards.clickSpeedMin"],
	"shards.trailLifetimeMinMs": ["shards.trailLifetimeMaxMs"],
	"shards.trailLifetimeMaxMs": ["shards.trailLifetimeMinMs"],
	"shards.trailSpeedMin": ["shards.trailSpeedMax"],
	"shards.trailSpeedMax": ["shards.trailSpeedMin"],
	"shards.sizeMin": ["shards.sizeMax"],
	"shards.sizeMax": ["shards.sizeMin"]
});
function M(e) {
	if (typeof e != "object" || !e || Object.isFrozen(e)) return e;
	for (let t of Object.values(e)) M(t);
	return Object.freeze(e);
}
function N(e, t, n = {}) {
	let r = e.split("."), i = j;
	for (let e of r) i = i[e];
	return {
		path: e,
		type: t,
		default: i,
		...n
	};
}
function de(e) {
	let t = e.path.split(".")[0], n = le[e.path], r = {
		...e,
		order: ce[e.path],
		group: t,
		groupOrder: se[t],
		labelKey: `baClickFx.params.${e.path}`,
		groupLabelKey: `baClickFx.paramGroups.${t}`,
		linkedParams: ue[e.path] ?? []
	};
	return n && (r.display = {
		min: n[0],
		max: n[1],
		step: n[2]
	}), r;
}
var fe = M([
	N("hit.enabled", "boolean", { unit: "boolean" }),
	N("hit.lifetimeMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("hit.radius", "number", {
		min: 1,
		max: 2e3,
		step: .01,
		unit: "px"
	}),
	N("flare.enabled", "boolean", { unit: "boolean" }),
	N("flare.lifetimeMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("flare.radius", "number", {
		min: 1,
		max: 2e3,
		step: .01,
		unit: "px"
	}),
	N("flare.rayCount", "number", {
		min: 1,
		max: 64,
		step: 1,
		unit: "count"
	}),
	N("disk.lifetimeMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("disk.radius", "number", {
		min: 1,
		max: 2e3,
		step: .01,
		unit: "px"
	}),
	N("rings.count", "number", {
		min: 0,
		max: 64,
		step: 1,
		unit: "count"
	}),
	N("rings.lifetimeMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("rings.radiusMin", "number", {
		min: 0,
		max: 2e3,
		step: .01,
		unit: "px"
	}),
	N("rings.radiusMax", "number", {
		min: 0,
		max: 2e3,
		step: .01,
		unit: "px"
	}),
	N("rings.bandToOuterRadius", "number", {
		min: 0,
		max: 1,
		step: 1e-4,
		unit: "ratio"
	}),
	N("rings.widthStart", "number", {
		min: 0,
		max: 8,
		step: .01,
		unit: "multiplier"
	}),
	N("rings.widthEnd", "number", {
		min: 0,
		max: 8,
		step: .01,
		unit: "multiplier"
	}),
	N("rings.angularVelocityMultiplier", "number", {
		min: 0,
		max: 100,
		step: .01,
		unit: "multiplier"
	}),
	N("rings.rotationDirection", "number", {
		min: -1,
		max: 1,
		step: 2,
		unit: "direction"
	}),
	N("rings.hdrIntensity", "number", {
		min: 0,
		max: 64,
		step: .01,
		unit: "linear-hdr"
	}),
	N("rings.arcSamples", "number", {
		min: 3,
		max: 1024,
		step: 1,
		unit: "samples"
	}),
	N("rings.radialSamples", "number", {
		min: 1,
		max: 32,
		step: 1,
		unit: "samples"
	}),
	N("rings.dissolveDirection", "number", {
		min: -1,
		max: 1,
		step: 2,
		unit: "direction"
	}),
	N("shards.hdrIntensity", "number", {
		min: 0,
		max: 64,
		step: .01,
		unit: "linear-hdr"
	}),
	N("shards.clickCount", "number", {
		min: 0,
		max: 1e3,
		step: 1,
		unit: "count"
	}),
	N("shards.clickLifetimeMinMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("shards.clickLifetimeMaxMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("shards.clickRadius", "number", {
		min: 0,
		max: 5e3,
		step: .01,
		unit: "px"
	}),
	N("shards.clickSpeedMin", "number", {
		min: 0,
		max: 5e3,
		step: .01,
		unit: "px-per-second"
	}),
	N("shards.clickSpeedMax", "number", {
		min: 0,
		max: 5e3,
		step: .01,
		unit: "px-per-second"
	}),
	N("shards.roundness", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	}),
	N("shards.trailLifetimeMinMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("shards.trailLifetimeMaxMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("shards.trailRadius", "number", {
		min: 0,
		max: 5e3,
		step: .01,
		unit: "px"
	}),
	N("shards.trailSpeedMin", "number", {
		min: 0,
		max: 5e3,
		step: .01,
		unit: "px-per-second"
	}),
	N("shards.trailSpeedMax", "number", {
		min: 0,
		max: 5e3,
		step: .01,
		unit: "px-per-second"
	}),
	N("shards.sizeMin", "number", {
		min: 0,
		max: 2e3,
		step: .01,
		unit: "px"
	}),
	N("shards.sizeMax", "number", {
		min: 0,
		max: 2e3,
		step: .01,
		unit: "px"
	}),
	N("shards.trailSpacing", "number", {
		min: 1,
		max: 5e3,
		step: .01,
		unit: "px"
	}),
	N("shards.maxCount", "number", {
		min: 0,
		max: 1e4,
		step: 1,
		unit: "count"
	}),
	N("trail.lifetimeMs", "number", {
		min: 1,
		max: 1e4,
		step: 1,
		unit: "ms"
	}),
	N("trail.geometryWidth", "number", {
		min: 0,
		max: 1e3,
		step: .01,
		unit: "px"
	}),
	N("trail.width", "number", {
		min: 0,
		max: 1e3,
		step: .01,
		unit: "px"
	}),
	N("trail.minVertexDistance", "number", {
		min: 0,
		max: 5e3,
		step: .01,
		unit: "px"
	}),
	N("trail.numCornerVertices", "number", {
		min: 0,
		max: 64,
		step: 1,
		unit: "count"
	}),
	N("trail.numCapVertices", "number", {
		min: 0,
		max: 64,
		step: 1,
		unit: "count"
	}),
	N("trail.outerGlowWidth", "number", {
		min: 0,
		max: 1e3,
		step: .1,
		unit: "px"
	}),
	N("trail.trailOpacity", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	}),
	N("bloom.threshold", "number", {
		min: 0,
		max: 64,
		step: .01,
		unit: "gamma-hdr"
	}),
	N("bloom.softKnee", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	}),
	N("bloom.clamp", "number", {
		min: 0,
		max: 65504,
		step: 1,
		unit: "gamma-hdr"
	}),
	N("bloom.intensity", "number", {
		min: 0,
		max: 10,
		step: .01,
		unit: "scalar"
	}),
	N("bloom.diffusion", "number", {
		min: 0,
		max: 10,
		step: .01,
		unit: "scalar"
	}),
	N("bloom.resolutionScale", "number", {
		min: .1,
		max: .75,
		step: .01,
		unit: "ratio"
	}),
	N("bloom.emissionRange", "number", {
		min: 1,
		max: 65504,
		step: .01,
		unit: "linear-hdr"
	}),
	N("bloom.diskEmission", "number", {
		min: 0,
		max: 64,
		step: .01,
		unit: "linear-hdr"
	}),
	N("bloom.trailEmission", "number", {
		min: 0,
		max: 65504,
		step: .01,
		unit: "linear-hdr"
	}),
	N("bloom.trailCoverageScale", "number", {
		min: 0,
		max: 8,
		step: .01,
		unit: "multiplier"
	}),
	N("bloom.trailEmissionAlpha", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	}),
	N("bloom.clickEmissionScale", "number", {
		min: 0,
		max: 4,
		step: .01,
		unit: "multiplier"
	}),
	N("bloom.ringEmissionAlpha", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	}),
	N("bloom.diskEmissionAlpha", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	}),
	N("bloom.ringBlur", "number", {
		min: 0,
		max: 1e3,
		step: .1,
		unit: "px"
	}),
	N("bloom.ringAlpha", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	}),
	N("bloom.diskBlur", "number", {
		min: 0,
		max: 1e3,
		step: .1,
		unit: "px"
	}),
	N("bloom.diskAlpha", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	}),
	N("bloom.trailAlpha", "number", {
		min: 0,
		max: 1,
		step: .01,
		unit: "ratio"
	})
].map(de)), pe = M([{
	fromVersion: 0,
	toVersion: 1,
	changes: [{
		kind: "replace",
		from: "bloom.scatter",
		to: "bloom.diffusion",
		source: {
			type: "number",
			min: 0
		},
		value: j.bloom.diffusion
	}]
}, {
	fromVersion: 1,
	toVersion: 2,
	changes: []
}]), P = Object.freeze({
	scale: 1,
	opacity: 1,
	themeColor: k,
	themeColorMode: A,
	clickEnabled: !0,
	trailEnabled: !0,
	trailAlways: !1,
	inputSource: "dom",
	inputSamplingRate: 0,
	clickTimeScale: 1,
	trailTimeScale: 1,
	outputCompositing: m,
	overlayAlphaPolicy: y,
	overlayColorCompensation: b,
	overlayAlphaLimit: h,
	hostCompositing: g,
	hostCompositingSurface: v,
	effectBackend: d,
	webgpuPreferHdr: !0,
	webgpuHdrPeak: o.peak,
	webgpuHdrBrightness: o.brightness,
	webgpuHdrColorPreservation: o.colorPreservation,
	webgpuHdrWhiteCore: o.whiteCore,
	webgpuHdrWhiteStart: o.whiteStart,
	webgpuHdrWhiteEnd: o.whiteEnd,
	bloomBackend: p,
	isolatedCompositing: !1,
	lightBackgroundContrastAlpha: 0,
	maxDpr: 1,
	touchAction: "auto"
});
function F(e) {
	return f.has(e);
}
function I(e, t = d) {
	return F(e) ? e : t;
}
function L(e) {
	return ee.has(e);
}
function R(e, t = p) {
	return L(e) ? e : t;
}
function z(e) {
	return te.has(e);
}
function B(e) {
	return e === 0 || Number.isFinite(e) && e >= 1 && e <= 1e3;
}
function me(e, t = 0) {
	return B(e) ? e : t;
}
function V(e) {
	return ne.has(e);
}
function he(e, t = m) {
	return V(e) ? e : t;
}
function ge(e, t = y) {
	return r(e, t);
}
function _e(e, t = b) {
	return a(e, t);
}
function H(e) {
	return Number.isFinite(e) && e >= 0 && e <= 1;
}
function ve(e, t = h) {
	let n = Number.isFinite(t) ? Math.max(0, Math.min(1, t)) : h;
	return Number.isFinite(e) ? Math.max(0, Math.min(1, e)) : n;
}
function U(e) {
	return _.has(e);
}
function W(e) {
	return e === "screen" || e === "plus-lighter";
}
function G(e, t = g) {
	return U(e) ? e : t;
}
function K(e) {
	return re.has(e);
}
function q(e, t = v) {
	return K(e) ? e : t;
}
function ye({ outputCompositing: e = m, requestedHostCompositing: t = g, hostCompositingSurface: n = v, hasCompositingReference: r = !1 } = {}) {
	let i = G(t), a = q(n), o = W(i);
	return e !== "browser-overlay" || r || !o ? {
		resolvedHostCompositing: "source-over",
		compositingWarning: null
	} : a === "transparent-window" ? {
		resolvedHostCompositing: "source-over",
		compositingWarning: `${i}-requires-visible-backdrop`
	} : {
		resolvedHostCompositing: i,
		compositingWarning: null
	};
}
function J(e) {
	return Number.isFinite(e) && e >= .01;
}
function be(e, t = 1) {
	return J(e) ? e : t;
}
function Y(e, t = k) {
	return typeof e != "string" || !/^#[0-9a-f]{6}$/i.test(e) ? t : e.toLowerCase();
}
function X(e) {
	return ie.has(e);
}
function xe(e, t = A) {
	return X(e) ? e : t;
}
function Z(e, t, n, r) {
	let i = Number.isFinite(t) ? Math.max(n, Math.min(r, t)) : n;
	return Number.isFinite(e) ? Math.max(n, Math.min(r, e)) : i;
}
function Q(e = {}, t = o) {
	let n = Z(e.webgpuHdrPeak, t.webgpuHdrPeak ?? t.peak, x, S), r = Z(e.webgpuHdrWhiteCore, t.webgpuHdrWhiteCore ?? t.whiteCore, 0, 1), i = Z(e.webgpuHdrBrightness, t.webgpuHdrBrightness ?? t.brightness, 0, C), a = Z(e.webgpuHdrColorPreservation, t.webgpuHdrColorPreservation ?? t.colorPreservation, 0, 1), s = Z(e.webgpuHdrWhiteStart, t.webgpuHdrWhiteStart ?? t.whiteStart, w, T), c = Z(e.webgpuHdrWhiteEnd, t.webgpuHdrWhiteEnd ?? t.whiteEnd, .01, E);
	return {
		webgpuHdrPeak: n,
		webgpuHdrBrightness: i,
		webgpuHdrColorPreservation: a,
		webgpuHdrWhiteCore: r,
		webgpuHdrWhiteStart: s,
		webgpuHdrWhiteEnd: Math.max(s + D, c)
	};
}
var Se = Object.freeze({
	scale: (e) => Number.isFinite(e) && e >= .01,
	opacity: (e) => Number.isFinite(e) && e >= 0 && e <= 1,
	themeColor: (e) => typeof e == "string" && /^#[0-9a-f]{6}$/i.test(e),
	themeColorMode: X,
	clickEnabled: (e) => typeof e == "boolean",
	trailEnabled: (e) => typeof e == "boolean",
	trailAlways: (e) => typeof e == "boolean",
	inputSource: z,
	inputSamplingRate: B,
	clickTimeScale: J,
	trailTimeScale: J,
	outputCompositing: V,
	overlayAlphaPolicy: n,
	overlayColorCompensation: i,
	overlayAlphaLimit: H,
	hostCompositing: U,
	hostCompositingSurface: K,
	effectBackend: F,
	webgpuPreferHdr: (e) => typeof e == "boolean",
	webgpuHdrPeak: (e) => Number.isFinite(e) && e >= x && e <= S,
	webgpuHdrBrightness: (e) => Number.isFinite(e) && e >= 0 && e <= C,
	webgpuHdrColorPreservation: (e) => Number.isFinite(e) && e >= 0 && e <= 1,
	webgpuHdrWhiteCore: (e) => Number.isFinite(e) && e >= 0 && e <= 1,
	webgpuHdrWhiteStart: (e) => Number.isFinite(e) && e >= w && e <= T,
	webgpuHdrWhiteEnd: (e) => Number.isFinite(e) && e >= D && e <= E,
	bloomBackend: L,
	isolatedCompositing: (e) => typeof e == "boolean",
	lightBackgroundContrastAlpha: (e) => Number.isFinite(e) && e >= 0 && e <= 1,
	maxDpr: (e) => Number.isFinite(e) && e >= 1,
	touchAction: (e) => typeof e == "string" && e.trim() !== ""
});
function $(e, { allowInstanceOptions: t = !1, fallback: n = P } = {}) {
	if (typeof e != "object" || !e || Array.isArray(e)) throw TypeError("BAClickFX 配置必须是对象");
	for (let [n, r] of Object.entries(e)) {
		if (t && (n === "target" || n === "inputFilter")) {
			if (n === "inputFilter" && r !== void 0 && typeof r != "function") throw TypeError("BAClickFX 配置项 inputFilter 无效");
			continue;
		}
		let e = Se[n];
		if (!e) throw TypeError(`BAClickFX 未知配置项: ${n}`);
		if (r !== void 0 && !e(r)) throw TypeError(`BAClickFX 配置项 ${n} 无效`);
	}
	let r = e.webgpuHdrWhiteStart ?? n.webgpuHdrWhiteStart ?? n.whiteStart;
	if ((e.webgpuHdrWhiteEnd ?? n.webgpuHdrWhiteEnd ?? n.whiteEnd) < r + D) throw TypeError("BAClickFX 配置项 webgpuHdrWhiteEnd 必须至少比 webgpuHdrWhiteStart 大 0.01");
}
function Ce(e = {}) {
	$(e);
	let t = Object.fromEntries(Object.entries(e).filter(([, e]) => e !== void 0)), n = Q(t, P);
	return {
		...P,
		...t,
		themeColor: t.themeColor === void 0 ? P.themeColor : t.themeColor.toLowerCase(),
		...n
	};
}
//#endregion
export { P as CONFIG, k as DEFAULT_THEME_COLOR, A as DEFAULT_THEME_COLOR_MODE, pe as FX_PARAM_MIGRATIONS, fe as FX_PARAM_SCHEMA, oe as FX_PARAM_SCHEMA_VERSION, O as MIN_TIME_SCALE, ae as SIZE_CORRECTION, j as UNITY_FX_TOUCH, $ as assertConfigOverrides, Ce as createConfig, L as isBloomBackend, F as isEffectBackend, U as isHostCompositing, K as isHostCompositingSurface, W as isIndependentHostCompositing, B as isInputSamplingRate, z as isInputSource, V as isOutputCompositing, H as isOverlayAlphaLimit, n as isOverlayAlphaPolicy, i as isOverlayColorCompensation, X as isThemeColorMode, J as isTimeScale, R as normalizeBloomBackend, I as normalizeEffectBackend, G as normalizeHostCompositing, q as normalizeHostCompositingSurface, me as normalizeInputSamplingRate, he as normalizeOutputCompositing, ve as normalizeOverlayAlphaLimit, ge as normalizeOverlayAlphaPolicyConfig, _e as normalizeOverlayColorCompensationConfig, Y as normalizeThemeColor, xe as normalizeThemeColorMode, be as normalizeTimeScale, Q as normalizeWebGPUHdrPresentation, ye as resolveHostCompositing };
