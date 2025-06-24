import express from 'express';
import fs from 'fs';
import path from 'path';
import { encrypt } from '../security/Encoder.js';
import ADMIN from '../security/middleware/UserRoles.js';

const router = express.Router();