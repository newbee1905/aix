pipeline {
	agent any

	environment {
		NODE_ENV			 = 'production'

		VERCEL_TOKEN	 = credentials('vercel-token')
		VERCEL_ORG		 = 'team_wz45GH7OUWlcXZOu74p2cV20'
		VERCEL_PROJECT = 'prj_2RrjFywZGW0gpozhotXlzjqAgG0f'

		POSTGRES_PRISMA_URL = 'postgres://newbee@localhost:5432/aix'

		JWT_SECRET            ="secret"
		JWT_EXPIRES_IN        =86400
		REFRESH_EXPIRES_IN    =2592000
		REFRESH_ROTATE_BEFORE =1296000

		SONAR_TOKEN = credentials('SONAR_TOKEN')
	}

	stages {
		stage('Checkout') {
			steps {
				git branch: 'main', url: 'https://github.com/newbee1905/aix.git'
			}
		}

		stage('Build') {
			steps {
				script {
					sh '''
						python3 -m venv .venv
						. .venv/bin/activate
						pip install --no-cache-dir -r scripts/requirements.txt
						cd scripts
						python export_and_quantize.py								
						cd ../
						cp -R public/models models
						pnpm install
						pnpm run build
					'''
				}
			}
			post {
				success {
					archiveArtifacts artifacts: '.next/**, public/**', fingerprint: true
				}
			}
		}

		stage('Test') {
			steps {
				sh 'pnpm test'
				sh '''
					COVERAGE=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
					if [ "$COVERAGE" -lt 75 ]; then
						echo "Coverage $COVERAGE% is below 75%" && exit 1
					fi
					echo "Coverage $COVERAGE% is $COVERAGE"
				'''
			}
			post {
				always {
					junit allowEmptyResults: true, testResults: '**/test-results.xml'
					archiveArtifacts artifacts: 'coverage/**', fingerprint: true
				}
			}
		}

		stage('SonarQube Analysis') {
			steps {
				sh 'pnpm sonar'
			}
		}

		stage('Security Audit') {
			steps {
				sh 'pnpm audit --json > audit.json || true'
				sh '''
					VULNS=$(node -e "\
						const fs = require('fs'); \
						const data = JSON.parse(fs.readFileSync('audit.json', 'utf8')); \
						const h = data.metadata.vulnerabilities.high || 0; \
						const c = data.metadata.vulnerabilities.critical || 0; \
						console.log(h + c); \
					")
					if [ "$VULNS" -gt 0 ]; then
						echo "Found $VULNS high/critical vulnerabilities" && exit 1
					fi
					echo "No high/critical vulnerabilities found."
				'''
			}
		}

		stage('Deploy & Verify Staging') {
			steps {
				script {
					sh '''
						pkill -f "pnpm start" || true

						nohup pnpm start -p 3000 -H 0.0.0.0 > staging.log 2>&1 &	
						PID=$!

						for i in {1..10}; do
							STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
							if [ "$STATUS" = "200" ]; then
								echo "Staging is up"
								exit 0
							fi
							sleep 3
						done

						echo "Staging did not respond" >&2
						kill "$PID" || true
						exit 1
					'''
				}
			}
		}

		stage('Deploy to Vercel') {
			steps {
				sh '''
					DEPLOY_OUTPUT=$(pnpm run deploy --token $VERCEL_TOKEN --confirm --prod --scope $VERCEL_ORG --project $VERCEL_PROJECT --json)
					echo "$DEPLOY_OUTPUT" > vercel-output.json
					DEPLOY_URL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('vercel-output.json')).url)")
					echo "Deployed to: $DEPLOY_URL"
					echo $DEPLOY_URL > vercel-url.txt
				'''
			}
		}

	}

	post {
		always {
			archiveArtifacts artifacts: 'staging.log, vercel-output.json, vercel-url.txt, curl_output.log', fingerprint: true
			cleanWs()
		}
	}
}

