import {
  ADJUNTO_MAX_FILES,
  ADJUNTO_MAX_FILES_ERROR_MESSAGE,
  ADJUNTO_DUPLICATE_ERROR_MESSAGE,
  ADJUNTO_ERROR_MESSAGE,
  ADJUNTO_MAX_FILE_SIZE_BYTES,
  ADJUNTO_MAX_NAME_LENGTH,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';
import type {
  CrearSolicitudAdjuntoDraftInput,
  CrearSolicitudAdjuntoKind,
  CrearSolicitudAdjuntoLocalItem,
  CrearSolicitudAdjuntoValidationIssue,
} from '@/stores/db_compras/solicitudes_compra/crear_solicitud/solicitudesCompraCrear.types';

const MIME_BY_EXTENSION: Record<string, string[]> = {
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  pdf: ['application/pdf'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

const KIND_BY_EXTENSION: Record<string, CrearSolicitudAdjuntoKind | null> = {
  png: 'image',
  jpg: 'image',
  jpeg: 'image',
  webp: 'image',
  pdf: 'pdf',
  docx: 'docx',
};

const createIssue = (file: File): CrearSolicitudAdjuntoValidationIssue => ({
  localId: crypto.randomUUID(),
  fileName: file.name,
  message: ADJUNTO_ERROR_MESSAGE,
});

const createDuplicateIssue = (file: File): CrearSolicitudAdjuntoValidationIssue => ({
  localId: crypto.randomUUID(),
  fileName: file.name,
  message: ADJUNTO_DUPLICATE_ERROR_MESSAGE,
});

const createMaxFilesIssue = (file: File): CrearSolicitudAdjuntoValidationIssue => ({
  localId: crypto.randomUUID(),
  fileName: file.name,
  message: ADJUNTO_MAX_FILES_ERROR_MESSAGE,
});

export const getAdjuntoExtension = (fileName: string): string => {
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.at(-1)?.toLowerCase() ?? '' : '';
};

export const getAdjuntoKind = (file: File): CrearSolicitudAdjuntoKind | null => {
  const extension = getAdjuntoExtension(file.name);
  return KIND_BY_EXTENSION[extension] ?? null;
};

export const buildAdjuntoFingerprint = (file: File): string => [
  file.name.trim().toLowerCase(),
  String(file.size),
  file.type.trim().toLowerCase(),
  String(file.lastModified),
].join('::');

export const normalizeAdjuntoBaseName = (value: string): string => value
  .trim()
  .replace(/\s+/g, '_')
  .slice(0, ADJUNTO_MAX_NAME_LENGTH);

export const buildAdjuntoDefaultBaseName = (index: number, now = new Date()): string => {
  const compactNow = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ].join('');

  return normalizeAdjuntoBaseName(`archivo${index}-${compactNow}`);
};

export const buildAdjuntoDisplayName = (
  value: string,
  originalFileName: string,
  fallbackIndex: number,
  now = new Date()
): string => {
  const extension = getAdjuntoExtension(originalFileName);
  const maxBaseLength = extension
    ? Math.max(1, ADJUNTO_MAX_NAME_LENGTH - extension.length - 1)
    : ADJUNTO_MAX_NAME_LENGTH;
  const normalizedValue = normalizeAdjuntoBaseName(value);
  const defaultBaseName = buildAdjuntoDefaultBaseName(fallbackIndex, now).slice(0, maxBaseLength);
  const baseName = (normalizedValue || defaultBaseName).slice(0, maxBaseLength);

  return extension
    ? `${baseName}.${extension}`
    : baseName;
};

export const isValidAdjuntoFile = (file: File): boolean => {
  const extension = getAdjuntoExtension(file.name);
  const mimeCandidates = MIME_BY_EXTENSION[extension];

  if (!mimeCandidates || file.size > ADJUNTO_MAX_FILE_SIZE_BYTES) {
    return false;
  }

  return file.type.length === 0 || mimeCandidates.includes(file.type.toLowerCase());
};

export const validateAdjuntosSelection = (
  items: CrearSolicitudAdjuntoDraftInput[],
  existingAdjuntos: CrearSolicitudAdjuntoLocalItem[]
): {
  acceptedItems: CrearSolicitudAdjuntoDraftInput[];
  invalidIssues: CrearSolicitudAdjuntoValidationIssue[];
} => {
  const existingFingerprints = new Set(existingAdjuntos.map((item) => item.fingerprint));
  const queuedFingerprints = new Set<string>();
  const acceptedItems: CrearSolicitudAdjuntoDraftInput[] = [];
  const invalidIssues: CrearSolicitudAdjuntoValidationIssue[] = [];

  items.forEach((item) => {
    const fingerprint = buildAdjuntoFingerprint(item.file);
    const isDuplicate = existingFingerprints.has(fingerprint) || queuedFingerprints.has(fingerprint);

    if (isDuplicate) {
      invalidIssues.push(createDuplicateIssue(item.file));
      return;
    }

    if (!isValidAdjuntoFile(item.file) || !getAdjuntoKind(item.file)) {
      invalidIssues.push(createIssue(item.file));
      return;
    }

    if (existingAdjuntos.length + acceptedItems.length >= ADJUNTO_MAX_FILES) {
      invalidIssues.push(createMaxFilesIssue(item.file));
      return;
    }

    queuedFingerprints.add(fingerprint);
    acceptedItems.push(item);
  });

  return {
    acceptedItems,
    invalidIssues,
  };
};

export const formatAdjuntoSize = (bytes: number): string => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
};

export const formatAdjuntoDisplayName = (fileName: string): string => {
  const extension = getAdjuntoExtension(fileName);
  const normalizedExtension = extension ? `.${extension}` : '';
  const baseName = normalizedExtension
    ? fileName.slice(0, -(normalizedExtension.length))
    : fileName;
  const trimmedBaseName = baseName.slice(0, 10);

  return `${trimmedBaseName}..... ${normalizedExtension}`.trim();
};
