function toDrivePreviewUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return "";

  const driveFileMatch = trimmed.match(/drive\.google\.com\/file\/d\/([^/]+)/);
  if (driveFileMatch?.[1]) return `https://drive.google.com/file/d/${driveFileMatch[1]}/preview`;

  const openIdMatch = trimmed.match(/[?&]id=([^&]+)/);
  if (trimmed.includes("drive.google.com") && openIdMatch?.[1]) {
    return `https://drive.google.com/file/d/${openIdMatch[1]}/preview`;
  }

  return trimmed;
}

export default function ReportPanel({ practicum, report, onChange }) {
  const url = report?.url ?? "";
  const previewUrl = toDrivePreviewUrl(url);

  return (
    <section className="panel report-panel compact-report-panel">
      <div className="panel-heading compact">
        <p className="eyebrow">Laporan Opsional</p>
        <h2>Link PDF Google Drive</h2>
      </div>
      <p className="helper-text">
        Kolom ini opsional untuk praktikum <strong>{practicum.title}</strong>. Khusus kolom ini, copy-paste link Google Drive diizinkan. Link ikut tersimpan saat tombol <strong>Simpan Jawaban</strong> ditekan.
      </p>
      <label>
        <span>Link PDF Google Drive</span>
        <input
          type="url"
          value={url}
          onChange={(event) => onChange({ url: event.target.value, savedAt: "", previewOpen: false })}
          placeholder="https://drive.google.com/file/d/.../view"
          inputMode="url"
          data-allow-paste="true"
          data-allow-copy="true"
        />
      </label>
      {previewUrl ? (
        <a className="report-preview-link" href={previewUrl} target="_blank" rel="noreferrer" data-allow-copy="true">
          Preview laporan Google Drive
        </a>
      ) : (
        <p className="notice muted">Link laporan tidak wajib. Kerjakan esai berdasarkan hasil pengamatan simulasi.</p>
      )}
    </section>
  );
}
