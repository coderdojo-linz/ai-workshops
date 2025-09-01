import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { getIronSession } from 'iron-session';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const PROXY_TARGET = process.env.PROXY_TARGET || 'http://open-webui:8080';
const SESSION_SECRET = process.env.SESSION_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER; // optional
const JWT_AUDIENCE = process.env.JWT_AUDIENCE; // optional
const USER_GROUPS = "users"; // Default groups assigned to all users

if (!SESSION_SECRET || !JWT_SECRET) {
	console.error('Missing required environment variables. Please set SESSION_SECRET and JWT_SECRET.');
	process.exit(1);
}


type User = {
	name: string;
	email: string;
	password: string;
	groups: string; // comma-separated string of groups
}

type SessionData = {
	authenticated: boolean;
	user: User;
}


const users: User[] = [];
const usersFile = path.join(__dirname, '..', 'data', 'users.csv');

if (fs.existsSync(usersFile)) {
	try {
		if (fs.existsSync(usersFile)) {
			const raw = fs.readFileSync(usersFile, 'utf8');
			const lines = raw.split(/\r?\n/).filter(l => l.trim().length > 0);
			if (lines.length > 0) {
				for (let i = 1; i < lines.length; i++) {
					const [name, email, password] = lines[i].split(',').map(s => s.trim());
					if (name && email && password) {
						users.push({ name, email, password, groups: USER_GROUPS });
					}
				}
			}
			console.log(`Loaded ${users.length} users from users.csv`);
		} else {
			throw new Error('users.csv not found');
		}
	} catch (err) {
		console.error('Failed to load users.csv:', err);
		process.exit(1);
	}
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', process.env.NODE_ENV === 'production');

// Redact JWT token from logs to avoid leaking secrets via query string
morgan.token('safe-url', (req: Request) => {
	try {
		const u = new URL((req as any).originalUrl || req.url, 'http://placeholder');
		u.searchParams.delete('token');
		const q = u.searchParams.toString();
		return q ? `${u.pathname}?${q}` : u.pathname;
	} catch {
		return req.path || req.url;
	}
});
app.use(morgan(':method :safe-url :status :res[content-length] - :response-time ms'));
app.use(express.urlencoded({ extended: true }));

const sessionOptions = {
	password: SESSION_SECRET,
	cookieName: 'session',
	ttl: 60 * 60 * 24 * 14, // 14 days
	cookieOptions: {
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
	},
};

async function isAuthenticated(req: Request, res: Response): Promise<boolean> {
	return (await getIronSession<SessionData>(req, res, sessionOptions))?.authenticated === true;
}

app.get('/health', (req: Request, res: Response) => {
	res.status(200).send('OK');
});

app.get('/logout', async (req: Request, res: Response) => {
	// use SESSION_SECRET, cookieName is session, use optimal cookieOptions
	const session = await getIronSession<SessionData>(req, res, sessionOptions);
	session.destroy();
	res.redirect('/login');
});

app.get('/api/v1/auths/signout', async (req: Request, res: Response) => {
	// use SESSION_SECRET, cookieName is session, use optimal cookieOptions
	const session = await getIronSession<SessionData>(req, res, sessionOptions);
	session.destroy();
	res.redirect('/login');
});

app.get('/login', async (req: Request, res: Response) => {
	if (await isAuthenticated(req, res)) return res.redirect('/');
	// If ?token=... is provided, use JWT auth
	const token = req.query.token;
	if (token && typeof token === 'string') {
		try {
			const decoded = jwt.verify(token, JWT_SECRET, {
				algorithms: ['HS256', 'HS384', 'HS512'],
				issuer: JWT_ISSUER,
				audience: JWT_AUDIENCE,
			}) as { email?: string; name?: string; groups?: string };
			if (decoded?.email && decoded?.name) {
				// Find user by email
				const user = {
					name: decoded.name,
					email: decoded.email,
					password: '',
					groups: decoded.groups || USER_GROUPS,
				};
				const session = await getIronSession<SessionData>(req, res, sessionOptions);
				session.authenticated = true;
				session.user = user;
				await session.save();
				return res.redirect('/');
			}
		} catch (err) {
			console.error('JWT verification failed:', err);
			return res.status(401).render('login', { error: 'Invalid token', hideForm: users.length === 0 });
		}
	}
	if (users.length > 0) {
		return res.render('login', { error: null, hideForm: false });
	} else {
		return res.status(503).render('login', { error: 'Please use the QR code to sign in.', hideForm: true });
	}
});

app.post('/login', async (req: Request, res: Response) => {
	if (users.length > 0) {
		const { username, password } = req.body;
		// Validate and normalize name: allow letters, numbers, spaces, . _ - '
		const raw = (username || '').trim();
		if (!/^[A-Za-z0-9 ._'-]{1,64}$/.test(raw)) {
			return res.status(400).render('login', { error: 'Invalid username format', hideForm: users.length === 0 });
		}
		const norm = raw.toLowerCase().replace(/\s+/g, ' ');

		// Find user by normalized name
		const user = users.find(u => (u.name || '').trim().toLowerCase().replace(/\s+/g, ' ') === norm);
		if (user && user.password === (password || '')) {
			// Successful login
			const session = await getIronSession<SessionData>(req, res, sessionOptions);
			session.authenticated = true;
			session.user = user;
			await session.save();
			return res.redirect('/');
		}
		return res.status(401).render('login', { error: 'Invalid credentials', hideForm: false });
	} else {
		return res.status(503).render('login', { error: 'No user database available', hideForm: true });
	}
});

// Protect all routes below
// Attach session user and protect routes (except /login and /health)
app.use(async (req: Request, res: Response, next: NextFunction) => {
	// Load session once and attach user info for downstream middlewares
	const session = await getIronSession<SessionData>(req, res, sessionOptions);
	(req as any).sessionUser = session?.user;

	// Allow unauthenticated access to login and health endpoints
	if (req.path === '/login' || req.path === '/health') {
		return next();
	}

	if (session?.authenticated !== true) {
		return res.redirect('/login');
	}

	// Strip any inbound trusted headers to enforce proxy-controlled identity
	delete (req.headers as any)['x-user-email'];
	delete (req.headers as any)['x-user-name'];
	delete (req.headers as any)['x-user-groups'];

	next();
});

// Proxy to Open WebUI with trusted headers
app.use('/', createProxyMiddleware({
	target: PROXY_TARGET,
	changeOrigin: true,
	ws: true,
	on: {
		proxyReq: (proxyReq: any, req: Request) => {
			const user = (req as any).sessionUser as User | undefined;
			if (user) {
				try {
					proxyReq.setHeader('X-User-Email', user.email);
					proxyReq.setHeader('X-User-Name', user.name);
					proxyReq.setHeader('X-User-Groups', user.groups);
				} catch (e) {
					console.error('Failed setting proxy request headers:', e);
				}
			}
		},
		proxyReqWs: (proxyReq: any, req: Request) => {
			const user = (req as any).sessionUser as User | undefined;
			if (user) {
				try {
					proxyReq.setHeader('X-User-Email', user.email);
					proxyReq.setHeader('X-User-Name', user.name);
					proxyReq.setHeader('X-User-Groups', user.groups);
				} catch (e) {
					console.error('Failed setting WS proxy headers:', e);
				}
			}
		},
	},
}));

app.listen(PORT, () => {
	console.log(`Auth proxy listening on port ${PORT}, forwarding to ${PROXY_TARGET}`);
});
