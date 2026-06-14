const fmt = (value, digits = 3) => {
  if (!Number.isFinite(value)) return "—";
  const rounded = Number(value.toFixed(digits));
  return rounded.toLocaleString("id-ID");
};

export const practicums = [
  {
    id: "ohm",
    shortTitle: "Ohm",
    title: "Hukum Ohm",
    icon: "Ω",
    theme: "electric",
    description:
      "Amati hubungan tegangan, hambatan, arus, dan daya pada rangkaian DC sederhana.",
    concept:
      "Pada suhu tetap, arus listrik berbanding lurus dengan tegangan dan berbanding terbalik dengan hambatan.",
    formula: "I = V / R",
    formulaLatex: "I = \\frac{V}{R}",
    controls: [
      { id: "voltage", label: "Tegangan", unit: "V", min: 1, max: 24, step: 0.5, default: 9 },
      { id: "resistance", label: "Hambatan", unit: "Ω", min: 1, max: 100, step: 1, default: 18 }
    ],
    calculate(values) {
      const current = values.voltage / values.resistance;
      const power = values.voltage * current;
      return {
        current,
        power,
        resistance: values.resistance,
        voltage: values.voltage,
        display: [
          { label: "Arus", value: fmt(current, 3), unit: "A" },
          { label: "Daya", value: fmt(power, 3), unit: "W" },
          { label: "Kemiringan grafik I-V", value: fmt(1 / values.resistance, 4), unit: "A/V" }
        ]
      };
    },
    questions: [
      "Jelaskan mengapa arus berubah ketika tegangan dinaikkan tetapi hambatan dipertahankan tetap. Hubungkan jawaban Anda dengan bentuk grafik I terhadap V.",
      "Jika hambatan rangkaian diperbesar, apa yang terjadi pada arus dan daya? Jelaskan menggunakan data pada simulasi."
    ]
  },
  {
    id: "lens",
    shortTitle: "Lensa",
    title: "Hukum Lensa",
    icon: "◐",
    theme: "optics",
    description:
      "Ubah jarak benda dan fokus lensa cembung untuk melihat perubahan jarak bayangan dan perbesaran.",
    concept:
      "Persamaan lensa tipis menghubungkan jarak fokus, jarak benda, dan jarak bayangan.",
    formula: "1/f = 1/s + 1/s'",
    formulaLatex: "\\frac{1}{f}=\\frac{1}{s}+\\frac{1}{s\\prime}",
    controls: [
      { id: "focalLength", label: "Jarak fokus", unit: "cm", min: 5, max: 30, step: 1, default: 12 },
      { id: "objectDistance", label: "Jarak benda", unit: "cm", min: 6, max: 80, step: 1, default: 36 },
      { id: "objectHeight", label: "Tinggi benda", unit: "cm", min: 2, max: 12, step: 0.5, default: 6 }
    ],
    calculate(values) {
      const f = values.focalLength;
      const s = values.objectDistance;
      const denom = 1 / f - 1 / s;
      const imageDistance = Math.abs(denom) < 1e-6 ? Infinity : 1 / denom;
      const magnification = Number.isFinite(imageDistance) ? -imageDistance / s : Infinity;
      const imageHeight = values.objectHeight * magnification;
      const imageType = imageDistance > 0 ? "nyata, terbalik" : "maya, tegak";
      return {
        focalLength: f,
        objectDistance: s,
        objectHeight: values.objectHeight,
        imageDistance,
        magnification,
        imageHeight,
        imageType,
        display: [
          { label: "Jarak bayangan", value: fmt(imageDistance, 2), unit: "cm" },
          { label: "Perbesaran", value: fmt(magnification, 3), unit: "×" },
          { label: "Sifat bayangan", value: imageType, unit: "" }
        ]
      };
    },
    questions: [
      "Jelaskan perbedaan sifat bayangan ketika benda berada di luar titik fokus dan ketika benda berada di antara lensa dan titik fokus.",
      "Bagaimana perubahan jarak benda memengaruhi jarak bayangan dan perbesaran? Gunakan hasil simulasi sebagai dasar argumen."
    ]
  },
  {
    id: "refraction",
    shortTitle: "Bias",
    title: "Indeks Bias",
    icon: "↘",
    theme: "optics",
    description:
      "Amati pembelokan cahaya saat melewati dua medium dengan indeks bias berbeda.",
    concept:
      "Menurut hukum Snellius, hasil kali indeks bias dan sinus sudut terhadap garis normal bernilai tetap pada batas dua medium.",
    formula: "n₁ sin θ₁ = n₂ sin θ₂",
    formulaLatex: "n_1\\sin\\theta_1=n_2\\sin\\theta_2",
    controls: [
      { id: "n1", label: "Indeks medium 1", unit: "", min: 1, max: 2.5, step: 0.01, default: 1 },
      { id: "n2", label: "Indeks medium 2", unit: "", min: 1, max: 2.5, step: 0.01, default: 1.5 },
      { id: "incidentAngle", label: "Sudut datang", unit: "°", min: 0, max: 80, step: 1, default: 35 }
    ],
    calculate(values) {
      const theta1 = (values.incidentAngle * Math.PI) / 180;
      const sinTheta2 = (values.n1 / values.n2) * Math.sin(theta1);
      const totalInternalReflection = Math.abs(sinTheta2) > 1;
      const theta2 = totalInternalReflection ? NaN : Math.asin(sinTheta2);
      const criticalAngle = values.n1 > values.n2 ? Math.asin(values.n2 / values.n1) * 180 / Math.PI : NaN;
      return {
        n1: values.n1,
        n2: values.n2,
        incidentAngle: values.incidentAngle,
        refractedAngle: totalInternalReflection ? NaN : theta2 * 180 / Math.PI,
        totalInternalReflection,
        criticalAngle,
        display: [
          { label: "Sudut bias", value: totalInternalReflection ? "pemantulan total" : fmt(theta2 * 180 / Math.PI, 2), unit: totalInternalReflection ? "" : "°" },
          { label: "n₁ sin θ₁", value: fmt(values.n1 * Math.sin(theta1), 3), unit: "" },
          { label: "Sudut kritis", value: Number.isFinite(criticalAngle) ? fmt(criticalAngle, 2) : "tidak terjadi", unit: Number.isFinite(criticalAngle) ? "°" : "" }
        ]
      };
    },
    questions: [
      "Jelaskan mengapa cahaya membelok mendekati garis normal ketika memasuki medium dengan indeks bias lebih besar.",
      "Kapan pemantulan total dapat terjadi? Jelaskan syaratnya berdasarkan nilai indeks bias dan sudut datang pada simulasi."
    ]
  },
  {
    id: "standing-wave",
    shortTitle: "Stasioner",
    title: "Gelombang Stasioner",
    icon: "∿",
    theme: "wave",
    description:
      "Visualisasikan simpul dan perut gelombang pada tali dengan kedua ujung terikat.",
    concept:
      "Gelombang stasioner terbentuk dari superposisi dua gelombang identik yang merambat berlawanan arah.",
    formula: "λ = 2L/n, f = nv/(2L)",
    formulaLatex: "\\lambda=\\frac{2L}{n},\\quad f=\\frac{nv}{2L}",
    controls: [
      { id: "length", label: "Panjang tali", unit: "m", min: 0.5, max: 3, step: 0.1, default: 1.5 },
      { id: "harmonic", label: "Harmonisa", unit: "", min: 1, max: 6, step: 1, default: 2 },
      { id: "waveSpeed", label: "Cepat rambat", unit: "m/s", min: 20, max: 200, step: 5, default: 90 },
      { id: "amplitude", label: "Amplitudo", unit: "cm", min: 1, max: 20, step: 1, default: 8 }
    ],
    calculate(values) {
      const wavelength = (2 * values.length) / values.harmonic;
      const frequency = values.waveSpeed / wavelength;
      return {
        length: values.length,
        harmonic: values.harmonic,
        waveSpeed: values.waveSpeed,
        amplitude: values.amplitude,
        wavelength,
        frequency,
        display: [
          { label: "Panjang gelombang", value: fmt(wavelength, 3), unit: "m" },
          { label: "Frekuensi", value: fmt(frequency, 2), unit: "Hz" },
          { label: "Jumlah perut", value: values.harmonic, unit: "" }
        ]
      };
    },
    questions: [
      "Jelaskan hubungan antara nomor harmonisa, panjang gelombang, dan jumlah perut gelombang yang terlihat pada simulasi.",
      "Jika cepat rambat gelombang tetap, mengapa frekuensi bertambah saat harmonisa dinaikkan?"
    ]
  },
  {
    id: "sound-resonance",
    shortTitle: "Resonansi",
    title: "Resonansi Bunyi",
    icon: "♫",
    theme: "acoustic",
    description:
      "Bandingkan pola resonansi pada pipa terbuka-terbuka dan terbuka-tertutup.",
    concept:
      "Resonansi terjadi saat gelombang bunyi membentuk pola stasioner yang sesuai dengan batas ujung pipa.",
    formula: "f = nv/(2L) atau f = (2n-1)v/(4L)",
    formulaLatex: "f=\\frac{nv}{2L}\\quad\\text{atau}\\quad f=\\frac{(2n-1)v}{4L}",
    controls: [
      { id: "tubeType", label: "Jenis pipa", type: "select", default: "open-open", options: [
        { value: "open-open", label: "Terbuka - terbuka" },
        { value: "open-closed", label: "Terbuka - tertutup" }
      ] },
      { id: "length", label: "Panjang pipa", unit: "m", min: 0.2, max: 2, step: 0.05, default: 0.8 },
      { id: "mode", label: "Mode", unit: "", min: 1, max: 5, step: 1, default: 2 },
      { id: "soundSpeed", label: "Cepat rambat bunyi", unit: "m/s", min: 300, max: 360, step: 1, default: 343 }
    ],
    calculate(values) {
      const isOpenClosed = values.tubeType === "open-closed";
      const frequency = isOpenClosed
        ? ((2 * values.mode - 1) * values.soundSpeed) / (4 * values.length)
        : (values.mode * values.soundSpeed) / (2 * values.length);
      const wavelength = values.soundSpeed / frequency;
      return {
        tubeType: values.tubeType,
        length: values.length,
        mode: values.mode,
        soundSpeed: values.soundSpeed,
        frequency,
        wavelength,
        display: [
          { label: "Frekuensi resonansi", value: fmt(frequency, 2), unit: "Hz" },
          { label: "Panjang gelombang", value: fmt(wavelength, 3), unit: "m" },
          { label: "Pola batas", value: isOpenClosed ? "simpul di ujung tertutup" : "perut di kedua ujung", unit: "" }
        ]
      };
    },
    questions: [
      "Jelaskan perbedaan pola simpul-perut pada pipa terbuka-terbuka dan pipa terbuka-tertutup.",
      "Mengapa frekuensi resonansi berubah ketika panjang pipa diperbesar? Gunakan persamaan yang sesuai."
    ]
  },
  {
    id: "capacitor",
    shortTitle: "Kapasitor",
    title: "Kapasitor",
    icon: "▌▐",
    theme: "electric",
    description:
      "Ubah tegangan dan kapasitansi untuk melihat muatan serta energi yang tersimpan pada kapasitor.",
    concept:
      "Kapasitor menyimpan muatan dan energi dalam medan listrik di antara dua pelat konduktor.",
    formula: "Q = CV, E = 1/2 CV²",
    formulaLatex: "Q=CV,\\quad E=\\frac{1}{2}CV^2",
    controls: [
      { id: "capacitance", label: "Kapasitansi", unit: "µF", min: 1, max: 1000, step: 1, default: 220 },
      { id: "voltage", label: "Tegangan", unit: "V", min: 1, max: 50, step: 1, default: 12 },
      { id: "plateDistance", label: "Jarak pelat", unit: "mm", min: 1, max: 20, step: 0.5, default: 6 }
    ],
    calculate(values) {
      const capacitanceFarad = values.capacitance * 1e-6;
      const chargeCoulomb = capacitanceFarad * values.voltage;
      const energyJoule = 0.5 * capacitanceFarad * values.voltage ** 2;
      const field = values.voltage / (values.plateDistance * 1e-3);
      return {
        capacitance: values.capacitance,
        voltage: values.voltage,
        plateDistance: values.plateDistance,
        chargeCoulomb,
        energyJoule,
        field,
        display: [
          { label: "Muatan", value: fmt(chargeCoulomb * 1e6, 2), unit: "µC" },
          { label: "Energi", value: fmt(energyJoule * 1000, 3), unit: "mJ" },
          { label: "Medan listrik", value: fmt(field, 0), unit: "V/m" }
        ]
      };
    },
    questions: [
      "Jelaskan mengapa muatan kapasitor meningkat ketika tegangan diperbesar pada kapasitansi tetap.",
      "Bagaimana jarak antarpelat memengaruhi kuat medan listrik? Jelaskan berdasarkan data simulasi."
    ]
  },
  {
    id: "transformer",
    shortTitle: "Trafo",
    title: "Prinsip Transformator",
    icon: "⟲",
    theme: "magnetic",
    description:
      "Simulasikan hubungan jumlah lilitan primer-sekunder terhadap tegangan keluaran transformator ideal.",
    concept:
      "Pada transformator ideal, perbandingan tegangan sama dengan perbandingan jumlah lilitan.",
    formula: "Vs/Vp = Ns/Np",
    formulaLatex: "\\frac{V_s}{V_p}=\\frac{N_s}{N_p}",
    controls: [
      { id: "primaryVoltage", label: "Tegangan primer", unit: "V", min: 6, max: 240, step: 1, default: 120 },
      { id: "primaryTurns", label: "Lilitan primer", unit: "", min: 50, max: 1000, step: 10, default: 400 },
      { id: "secondaryTurns", label: "Lilitan sekunder", unit: "", min: 50, max: 1000, step: 10, default: 200 }
    ],
    calculate(values) {
      const ratio = values.secondaryTurns / values.primaryTurns;
      const secondaryVoltage = values.primaryVoltage * ratio;
      const type = ratio > 1 ? "step-up" : ratio < 1 ? "step-down" : "isolasi";
      return {
        primaryVoltage: values.primaryVoltage,
        primaryTurns: values.primaryTurns,
        secondaryTurns: values.secondaryTurns,
        ratio,
        secondaryVoltage,
        type,
        display: [
          { label: "Tegangan sekunder", value: fmt(secondaryVoltage, 2), unit: "V" },
          { label: "Rasio lilitan", value: fmt(ratio, 3), unit: "" },
          { label: "Jenis trafo", value: type, unit: "" }
        ]
      };
    },
    questions: [
      "Jelaskan mengapa tegangan sekunder dapat lebih besar atau lebih kecil daripada tegangan primer pada transformator ideal.",
      "Jika jumlah lilitan sekunder dinaikkan sementara lilitan primer tetap, apa konsekuensinya terhadap tegangan keluaran? Jelaskan."
    ]
  },
  {
    id: "thermal-expansion",
    shortTitle: "Muai",
    title: "Muai Panjang",
    icon: "⇔",
    theme: "thermal",
    description:
      "Amati perubahan panjang batang akibat perubahan suhu dan koefisien muai panjang.",
    concept:
      "Pertambahan panjang benda padat sebanding dengan panjang awal, koefisien muai panjang, dan perubahan suhu.",
    formula: "ΔL = αL₀ΔT",
    formulaLatex: "\\Delta L=\\alpha L_0\\Delta T",
    controls: [
      { id: "initialLength", label: "Panjang awal", unit: "m", min: 0.2, max: 5, step: 0.1, default: 2 },
      { id: "alpha", label: "Koefisien α", unit: "×10⁻⁶/°C", min: 5, max: 30, step: 0.5, default: 12 },
      { id: "deltaT", label: "Perubahan suhu", unit: "°C", min: 0, max: 300, step: 1, default: 80 }
    ],
    calculate(values) {
      const alpha = values.alpha * 1e-6;
      const deltaLength = alpha * values.initialLength * values.deltaT;
      const finalLength = values.initialLength + deltaLength;
      return {
        initialLength: values.initialLength,
        alpha: values.alpha,
        deltaT: values.deltaT,
        deltaLength,
        finalLength,
        display: [
          { label: "Pertambahan panjang", value: fmt(deltaLength * 1000, 3), unit: "mm" },
          { label: "Panjang akhir", value: fmt(finalLength, 5), unit: "m" },
          { label: "Regangan termal", value: fmt(deltaLength / values.initialLength, 6), unit: "" }
        ]
      };
    },
    questions: [
      "Jelaskan mengapa pertambahan panjang bergantung pada panjang awal dan perubahan suhu.",
      "Bandingkan pengaruh koefisien muai panjang dan perubahan suhu terhadap ΔL. Variabel mana yang paling dominan pada percobaan Anda?"
    ]
  }
];

export function buildInitialValues() {
  return Object.fromEntries(
    practicums.map((practicum) => [
      practicum.id,
      Object.fromEntries(practicum.controls.map((control) => [control.id, control.default]))
    ])
  );
}

export function buildInitialAnswers() {
  return Object.fromEntries(
    practicums.map((practicum) => [
      practicum.id,
      practicum.questions.map(() => "")
    ])
  );
}
