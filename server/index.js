// @ts-check

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fastifyFormbody from '@fastify/formbody';
import fastifyPassport from '@fastify/passport';
import fastifySecureSession from '@fastify/secure-session';
import fastifySensible from '@fastify/sensible';
import fastifyStatic from '@fastify/static';
// NOTE: не поддердивает fastify 4.x
// import fastifyErrorPage from 'fastify-error-page';
import fastifyView from '@fastify/view';
import { Eta } from 'eta';
import { plugin as fastifyReverseRoutes } from 'fastify-reverse-routes';
import i18next from 'i18next';
import qs from 'qs';
import { db } from './db/index.js';
import getHelpers from './helpers/index.js';
// import fastifyMethodOverride from '@hexlet/fastify-method-override';
import FormStrategy from './lib/passportStrategies/FormStrategy.js';
import { findUserById } from './lib/users.js';
import en from './locales/en.js';
import ru from './locales/ru.js';
// @ts-expect-error
import addRoutes from './routes/index.js';

const __dirname = fileURLToPath(path.dirname(import.meta.url));

const setUpViews = (app) => {
    const helpers = getHelpers(app);
    const eta = new Eta();

    app.register(fastifyView, {
        engine: {
            eta,
        },
        defaultContext: {
            ...helpers,
            assetPath: (filename) => `/assets/${filename}`,
        },
        templates: path.join(__dirname, '..', 'server', 'views'),
        layout: 'layouts/application',
    });

    app.decorateReply('render', function render(viewPath, locals) {
        return this.view(viewPath, { ...locals, reply: this });
    });
};

const setUpStaticAssets = (app) => {
    const pathPublic = path.join(__dirname, '..', 'dist');
    app.register(fastifyStatic, {
        root: pathPublic,
        prefix: '/assets/',
    });
};

const setupLocalization = async () => {
    await i18next.init({
        lng: 'en',
        fallbackLng: 'ru',
        // debug: isDevelopment,
        resources: {
            ru,
            en,
        },
    });
};

const addHooks = (app) => {
    app.addHook('preHandler', async (req, reply) => {
        reply.locals = {
            isAuthenticated: () => req.isAuthenticated(),
        };
    });
};

const registerPlugins = async (app) => {
    await app.register(fastifySensible);
    // await app.register(fastifyErrorPage);
    await app.register(fastifyReverseRoutes);
    await app.register(fastifyFormbody, { parser: qs.parse });
    await app.register(fastifySecureSession, {
        secret: process.env.SESSION_KEY,
        cookie: {
            path: '/',
        },
    });

    fastifyPassport.registerUserDeserializer((user) => findUserById(user.id));
    fastifyPassport.registerUserSerializer((user) => Promise.resolve(user));
    fastifyPassport.use(new FormStrategy('form'));
    await app.register(fastifyPassport.initialize());
    await app.register(fastifyPassport.secureSession());
    await app.decorate('fp', fastifyPassport);
    app.decorate('authenticate', (...args) =>
        fastifyPassport.authenticate(
            'form',
            {
                failureRedirect: app.reverse('root'),
                failureFlash: i18next.t('flash.authError'),
            },
            // @ts-expect-error
        )(...args),
    );

    // await app.register(fastifyMethodOverride);
};

export const options = {
    exposeHeadRoutes: false,
};

export default async (app, _options) => {
    await registerPlugins(app);

    app.addHook('onClose', async () => {
        await db.$client.end();
    });

    await setupLocalization();
    setUpViews(app);
    setUpStaticAssets(app);
    addRoutes(app);
    addHooks(app);

    return app;
};
