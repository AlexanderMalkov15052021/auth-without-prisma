import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { RedisStore } from 'connect-redis'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import IORedis from 'ioredis'

import { AppModule } from './app.module'
import { ms, StringValue } from './libs/common/utils/ms.util'
import { parseBoolean } from './libs/common/utils/parse-boolean.util'

import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	const redis = new IORedis(process.env.REDIS_URL);

	app.use((cookieParser as any)(process.env.COOKIES_SECRET));

	app.useGlobalPipes(
		new ValidationPipe({
			transform: true
		})
	)

	app.use(
		(session as any)({
			// Настройки управления сессиями с использованием Redis
			secret: process.env.SESSION_SECRET,
			name: process.env.SESSION_NAME,
			resave: true,
			saveUninitialized: false,
			cookie: {
				domain: process.env.SESSION_DOMAIN,
				maxAge: ms(process.env.SESSION_MAX_AGE as StringValue),
				httpOnly: parseBoolean(
					process.env.SESSION_HTTP_ONLY
				),
				secure: parseBoolean(
					process.env.SESSION_SECURE
				),
				sameSite: 'lax'
			},
			store: new RedisStore({
				client: redis,
				prefix: process.env.SESSION_FOLDER
			})
		})
	)

	app.enableCors({
		// Настройки CORS для приложения
		origin: process.env.ALLOWED_ORIGIN,
		credentials: true,
		exposedHeaders: ['set-cookie']
	})

	await app.listen(process.env.APPLICATION_PORT ?? 4000)
}
bootstrap()
