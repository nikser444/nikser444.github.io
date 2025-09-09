import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';

// Размеры для изображений
const IMAGE_SIZES = {
  avatar: { width: 200, height: 200 },
  thumbnail: { width: 150, height: 150 },
  preview: { width: 800, height: 600 }
};

// Максимальные размеры файлов (в байтах)
const FILE_SIZE_LIMITS = {
  avatar: 5 * 1024 * 1024, // 5MB
  image: 10 * 1024 * 1024, // 10MB
  file: 50 * 1024 * 1024, // 50MB
  audio: 20 * 1024 * 1024, // 20MB
  video: 100 * 1024 * 1024 // 100MB
};

// Разрешенные типы файлов
const ALLOWED_MIME_TYPES = {
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ],
  audio: [
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/mp4'
  ],
  video: [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo'
  ],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
};

/**
 * Создание папок для загрузки, если они не существуют
 */
const ensureDirectoryExists = (dirPath: string): void => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Генерация уникального имени файла
 */
const generateFileName = (originalName: string): string => {
  const ext = path.extname(originalName);
  const name = path.basename(originalName, ext);
  const sanitizedName = name.replace(/[^a-zA-Z0-9]/g, '_');
  const uniqueId = uuidv4();
  const timestamp = Date.now();
  
  return `${sanitizedName}_${timestamp}_${uniqueId}${ext}`;
};

/**
 * Настройка хранения файлов
 */
const createStorage = (uploadPath: string) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = path.join(process.cwd(), 'uploads', uploadPath);
      ensureDirectoryExists(fullPath);
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const fileName = generateFileName(file.originalname);
      cb(null, fileName);
    }
  });
};

/**
 * Фильтр файлов по типу
 */
const createFileFilter = (allowedTypes: string[]) => {
  return (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Неподдерживаемый тип файла: ${file.mimetype}`));
    }
  };
};

/**
 * Базовая конфигурация multer
 */
const createUploadConfig = (
  uploadPath: string,
  allowedTypes: string[],
  maxSize: number,
  maxFiles: number = 1
) => {
  return multer({
    storage: createStorage(uploadPath),
    fileFilter: createFileFilter(allowedTypes),
    limits: {
      fileSize: maxSize,
      files: maxFiles
    }
  });
};

/**
 * Middleware для загрузки аватаров
 */
export const uploadAvatar = createUploadConfig(
  'avatars',
  ALLOWED_MIME_TYPES.image,
  FILE_SIZE_LIMITS.avatar,
  1
).single('avatar');

/**
 * Middleware для загрузки изображений в чат
 */
export const uploadChatImages = createUploadConfig(
  'files',
  ALLOWED_MIME_TYPES.image,
  FILE_SIZE_LIMITS.image,
  5
).array('images', 5);

/**
 * Middleware для загрузки любых файлов в чат
 */
export const uploadChatFiles = createUploadConfig(
  'files',
  [
    ...ALLOWED_MIME_TYPES.image,
    ...ALLOWED_MIME_TYPES.audio,
    ...ALLOWED_MIME_TYPES.video,
    ...ALLOWED_MIME_TYPES.document
  ],
  FILE_SIZE_LIMITS.file,
  10
).array('files', 10);

/**
 * Middleware для загрузки аудио файлов
 */
export const uploadAudio = createUploadConfig(
  'files',
  ALLOWED_MIME_TYPES.audio,
  FILE_SIZE_LIMITS.audio,
  1
).single('audio');

/**
 * Middleware для загрузки видео файлов
 */
export const uploadVideo = createUploadConfig(
  'files',
  ALLOWED_MIME_TYPES.video,
  FILE_SIZE_LIMITS.video,
  1
).single('video');

/**
 * Обработчик ошибок загрузки
 */
export const handleUploadError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (error instanceof multer.MulterError) {
    let message = 'Ошибка загрузки файла';

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'Файл слишком большой';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Слишком много файлов';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Неожиданное поле файла';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Слишком много частей';
        break;
      case 'LIMIT_FIELD_KEY':
        message = 'Имя поля слишком длинное';
        break;
      case 'LIMIT_FIELD_VALUE':
        message = 'Значение поля слишком длинное';
        break;
      case 'LIMIT_FIELD_COUNT':
        message = 'Слишком много полей';
        break;
    }

    res.status(400).json({
      success: false,
      message,
      error: error.code
    });
    return;
  }

  if (error.message.includes('Неподдерживаемый тип файла')) {
    res.status(400).json({
      success: false,
      message: error.message
    });
    return;
  }

  console.error('Ошибка загрузки файла:', error);
  res.status(500).json({
    success: false,
    message: 'Внутренняя ошибка сервера при загрузке файла'
  });
};

/**
 * Middleware для обработки изображений
 */
export const processImage = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file || !ALLOWED_MIME_TYPES.image.includes(req.file.mimetype)) {
      next();
      return;
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));

    // Создаем различные размеры изображения
    const sizes = ['thumbnail', 'preview'] as const;
    const processedImages: Record<string, string> = {
      original: inputPath
    };

    for (const size of sizes) {
      const outputPath = path.join(outputDir, `${baseName}_${size}.webp`);
      const { width, height } = IMAGE_SIZES[size];

      await sharp(inputPath)
        .resize(width, height, {
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 80 })
        .toFile(outputPath);

      processedImages[size] = outputPath;
    }

    // Добавляем информацию о обработанных изображениях в запрос
    (req as any).processedImages = processedImages;

    next();
  } catch (error) {
    console.error('Ошибка обработки изображения:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обработки изображения'
    });
  }
};

/**
 * Middleware для обработки аватара
 */
export const processAvatar = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file || !ALLOWED_MIME_TYPES.image.includes(req.file.mimetype)) {
      next();
      return;
    }

    const inputPath = req.file.path;
    const outputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    const outputPath = path.join(outputDir, `${baseName}_processed.webp`);

    // Обрезаем и сжимаем аватар
    await sharp(inputPath)
      .resize(IMAGE_SIZES.avatar.width, IMAGE_SIZES.avatar.height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 90 })
      .toFile(outputPath);

    // Удаляем оригинальный файл
    fs.unlinkSync(inputPath);

    // Обновляем информацию о файле
    req.file.path = outputPath;
    req.file.filename = path.basename(outputPath);

    next();
  } catch (error) {
    console.error('Ошибка обработки аватара:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обработки аватара'
    });
  }
};

/**
 * Middleware для получения метаданных файла
 */
export const extractFileMetadata = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      next();
      return;
    }

    const file = req.file;
    const metadata: any = {
      originalName: file.originalname,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path
    };

    // Дополнительные метаданные для изображений
    if (ALLOWED_MIME_TYPES.image.includes(file.mimetype)) {
      try {
        const imageInfo = await sharp(file.path).metadata();
        metadata.width = imageInfo.width;
        metadata.height = imageInfo.height;
        metadata.format = imageInfo.format;
      } catch (error) {
        console.warn('Не удалось получить метаданные изображения:', error);
      }
    }

    // Добавляем метаданные в запрос
    (req as any).fileMetadata = metadata;

    next();
  } catch (error) {
    console.error('Ошибка извлечения метаданных файла:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка обработки файла'
    });
  }
};

/**
 * Middleware для валидации типа файла по содержимому
 */
export const validateFileContent = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      next();
      return;
    }

    const file = req.file;
    
    // Проверяем реальный MIME-тип файла
    const { fileTypeFromFile } = await import('file-type');
    const detectedType = await fileTypeFromFile(file.path);

    if (detectedType && detectedType.mime !== file.mimetype) {
      // Удаляем загруженный файл
      fs.unlinkSync(file.path);
      
      res.status(400).json({
        success: false,
        message: 'Тип файла не соответствует его содержимому'
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Ошибка валидации содержимого файла:', error);
    next(); // Продолжаем выполнение, если не удалось проверить
  }
};

/**
 * Middleware для очистки временных файлов при ошибке
 */
export const cleanupOnError = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Удаляем загруженные файлы при ошибке
  if (req.file) {
    try {
      fs.unlinkSync(req.file.path);
    } catch (err) {
      console.warn('Не удалось удалить файл:', req.file.path);
    }
  }

  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.warn('Не удалось удалить файл:', file.path);
      }
    });
  }

  // Удаляем обработанные изображения
  if ((req as any).processedImages) {
    const processedImages = (req as any).processedImages;
    Object.values(processedImages).forEach(imagePath => {
      try {
        if (typeof imagePath === 'string' && imagePath !== req.file?.path) {
          fs.unlinkSync(imagePath);
        }
      } catch (err) {
        console.warn('Не удалось удалить обработанное изображение:', imagePath);
      }
    });
  }

  next(error);
};

/**
 * Middleware для проверки квоты пользователя
 */
export const checkUserQuota = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Пользователь не аутентифицирован'
      });
      return;
    }

    // Здесь должна быть логика проверки квоты пользователя
    // Например, проверка общего размера загруженных файлов
    // const userQuota = await getUserQuota(userId);
    // const fileSize = req.file ? req.file.size : 0;
    
    // if (userQuota.used + fileSize > userQuota.limit) {
    //   res.status(413).json({
    //     success: false,
    //     message: 'Превышена квота на загрузку файлов'
    //   });
    //   return;
    // }

    next();
  } catch (error) {
    console.error('Ошибка проверки квоты:', error);
    res.status(500).json({
      success: false,
      message: 'Ошибка проверки квоты'
    });
  }
};

/**
 * Middleware для логирования загрузок
 */
export const logFileUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const userId = (req as any).user?.id || 'anonymous';
  const userAgent = req.get('User-Agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  if (req.file) {
    console.log(`[UPLOAD] User: ${userId}, File: ${req.file.originalname}, Size: ${req.file.size}, IP: ${ip}, UA: ${userAgent}`);
  }

  if (req.files && Array.isArray(req.files)) {
    req.files.forEach(file => {
      console.log(`[UPLOAD] User: ${userId}, File: ${file.originalname}, Size: ${file.size}, IP: ${ip}, UA: ${userAgent}`);
    });
  }

  next();
};

/**
 * Утилита для удаления файла
 */
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * Утилита для получения URL файла
 */
export const getFileUrl = (filePath: string): string => {
  // Преобразуем абсолютный путь в относительный URL
  const relativePath = path.relative(path.join(process.cwd(), 'uploads'), filePath);
  return `/uploads/${relativePath.replace(/\\/g, '/')}`;
};

/**
 * Middleware для проверки существования файла
 */
export const checkFileExists = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const filePath = req.params.filePath;
  
  if (!filePath) {
    res.status(400).json({
      success: false,
      message: 'Путь к файлу не указан'
    });
    return;
  }

  const fullPath = path.join(process.cwd(), 'uploads', filePath);
  
  // Проверяем, что путь находится в папке uploads (безопасность)
  if (!fullPath.startsWith(path.join(process.cwd(), 'uploads'))) {
    res.status(403).json({
      success: false,
      message: 'Доступ к файлу запрещен'
    });
    return;
  }

  if (!fs.existsSync(fullPath)) {
    res.status(404).json({
      success: false,
      message: 'Файл не найден'
    });
    return;
  }

  (req as any).fullFilePath = fullPath;
  next();
};

/**
 * Конфигурация для различных типов загрузок
 */
export const uploadConfigs = {
  avatar: {
    middleware: [uploadAvatar, processAvatar, extractFileMetadata],
    maxSize: FILE_SIZE_LIMITS.avatar,
    allowedTypes: ALLOWED_MIME_TYPES.image
  },
  chatImages: {
    middleware: [uploadChatImages, processImage, extractFileMetadata],
    maxSize: FILE_SIZE_LIMITS.image,
    allowedTypes: ALLOWED_MIME_TYPES.image
  },
  chatFiles: {
    middleware: [uploadChatFiles, extractFileMetadata],
    maxSize: FILE_SIZE_LIMITS.file,
    allowedTypes: [
      ...ALLOWED_MIME_TYPES.image,
      ...ALLOWED_MIME_TYPES.audio,
      ...ALLOWED_MIME_TYPES.video,
      ...ALLOWED_MIME_TYPES.document
    ]
  },
  audio: {
    middleware: [uploadAudio, extractFileMetadata],
    maxSize: FILE_SIZE_LIMITS.audio,
    allowedTypes: ALLOWED_MIME_TYPES.audio
  },
  video: {
    middleware: [uploadVideo, extractFileMetadata],
    maxSize: FILE_SIZE_LIMITS.video,
    allowedTypes: ALLOWED_MIME_TYPES.video
  }
};