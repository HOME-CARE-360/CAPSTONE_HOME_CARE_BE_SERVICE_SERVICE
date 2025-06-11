import { existsSync } from 'fs'
import { PythonShell } from 'python-shell'
import { Injectable } from '@nestjs/common';
const MODEL_PATH = 'model/recommendation_model.pkl'

@Injectable()
export class AIService {
    createAIModel = async () => {
        if (!existsSync(MODEL_PATH)) {
            console.log('🧠 Model not found. Training...')
            await PythonShell.run('train_model.py', {
                pythonPath: 'python3',
                scriptPath: process.cwd(),
            });
        }
    }
}
const run = new AIService()
run.createAIModel()
