pipeline {
	agent any

	environment {
		NODE_ENV			 = 'production'
		VERCEL_TOKEN	 = credentials('vercel-token')
		VERCEL_ORG		 = 'team_wz45GH7OUWlcXZOu74p2cV20'
		VERCEL_PROJECT = 'prj_2RrjFywZGW0gpozhotXlzjqAgG0f'
		POSTGRES_PRISMA_URL = 'postgres://newbee@localhost:5432/aix'
		JWT_SECRET="secret"
		JWT_EXPIRES_IN=86400
		REFRESH_EXPIRES_IN=2592000
		REFRESH_ROTATE_BEFORE=1296000
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
				sh 'pnpm test --coverage --coverageReporters=json-summary'
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

		// stage('SonarQube Analysis') {
		// 	steps {
		// 		withSonarQubeEnv('SonarQube') {
		// 			sh 'pnpm run sonar'
		// 		}
		// 	}
		// }

		stage('Security Audit') {
			steps {
				sh 'pnpm audit --json > audit.json || true'
			}
		}

		stage('Deploy to Staging') {
			steps {
				script {
					sh '''
						pkill -f "pnpm start" || true

						nohup pnpm start > staging.log 2>&1 &
					'''
				}
			}
		}

		stage('Deploy to Vercel') {
			steps {
				sh 'pnpm install -g vercel'
				sh '''
					DEPLOY_OUTPUT=$(vercel --token $VERCEL_TOKEN --confirm --prod --scope $VERCEL_ORG --project $VERCEL_PROJECT --json)
					echo "$DEPLOY_OUTPUT" > vercel-output.json
					DEPLOY_URL=$(node -e "console.log(JSON.parse(require('fs').readFileSync('vercel-output.json')).url)")
					echo "Deployed to: $DEPLOY_URL"
					echo $DEPLOY_URL > vercel-url.txt
				'''
			}
		}

		stage('Verify Production') {
			steps {
				sh '''
					PROD_URL=$(cat vercel-url.txt)
					for i in {1..10}; do
						HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$PROD_URL)
						if [ "$HTTP_CODE" -eq 200 ]; then
							echo "Production is up" && exit 0
						fi
						sleep 5
					done
					echo "Production did not respond" && exit 1
				'''
			}
		}
	}

	post {
		always {
			cleanWs()
		}
	}
}

