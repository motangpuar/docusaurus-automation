@NonCPS
def parseReposJson(String jsonText) {
    def parsed = new groovy.json.JsonSlurper().parseText(jsonText)
    return parsed.collect { repo ->
        [
            name: repo.name.toString(),
            url: repo.url.toString(),
            docs_path: repo.docs_path.toString(),
            target_path: repo.target_path.toString()
        ]
    }
}

pipeline {
    agent any

    parameters {
        string(name: 'DOCUSAURUS_REPO', defaultValue: 'https://github.com/motangpuar/docusaurus-automation.git')
        string(name: 'REGISTRY', defaultValue: 'bmw.ece.ntust.edu.tw/infidel')
        string(name: 'TARGET_HOST', defaultValue: 'docusaurus-server')
        string(name: 'GIT_CREDENTIAL_ID', defaultValue: 'gh_token')
        string(name: 'REGISTRY_CREDENTIAL_ID', defaultValue: 'admin_account')
        booleanParam(name: 'DEPLOY_TO_TARGET', defaultValue: false)
    }

    stages {
        stage('Clone Main Repo') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: params.GIT_CREDENTIAL_ID,
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_PASS'
                    )]) {
                        def cleanUrl = params.DOCUSAURUS_REPO.replaceAll('^https?://', '')
                        sh """
                            rm -rf * .git
                            git clone https://\${GIT_USER}:\${GIT_PASS}@${cleanUrl} .
                        """
                    }
                }
            }
        }

        stage('Process Content Repos') {
            steps {
                script {
                    def reposJsonText = readFile('repos.json')
                    def repos = parseReposJson(reposJsonText)

                    echo "Found ${repos.size()} repositories to process"

                    sh 'rm -rf docs/* temp'
                    sh 'mkdir -p docs temp'

                    for (int i = 0; i < repos.size(); i++) {
                        def repo = repos[i]
                        echo "Processing ${repo.name}..."

                        withCredentials([usernamePassword(
                            credentialsId: params.GIT_CREDENTIAL_ID,
                            usernameVariable: 'GIT_USER',
                            passwordVariable: 'GIT_PASS'
                        )]) {
                            def cleanRepoUrl = repo.url.replaceAll('^https?://', '')
                            sh """
                                cd temp
                                git clone https://\${GIT_USER}:\${GIT_PASS}@${cleanRepoUrl} ${repo.name}
                                cd ..
                                mkdir -p ${repo.target_path}
                                cp -r temp/${repo.name}/${repo.docs_path}/* ${repo.target_path}/
                                echo "Copied ${repo.name} to ${repo.target_path}"
                            """
                        }
                    }

                    sh 'rm -rf temp'
                    sh 'find docs -type f | head -20'
                }
            }
        }
        stage('Verify Content') {
            steps {
                sh '''
                    echo "=== Verifying docs structure before build ==="
                    ls -la
                    echo "=== Docs folder contents ==="
                    ls -la docs/ || echo "docs/ does not exist!"
                    echo "=== All files in docs ==="
                    find docs/ -type f || echo "No files found!"
                    echo "=== repos.json content ==="
                    cat repos.json
                '''
            }
        }

        stage('Build Image') {
            steps {
                sh """
                    ulimit -n 65536
                    podman build --ulimit nofile=65536:65536 \
                        -t ${params.REGISTRY}/docusaurus:latest \
                        -f Dockerfile.prod .
                """
            }
        }

        stage('Push Image') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: params.REGISTRY_CREDENTIAL_ID,
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASS'
                    )]) {
                        sh """
                            echo "Logging into registry ${params.REGISTRY}..."
                            echo \${REGISTRY_PASS} | podman login ${params.REGISTRY} \
                                --username \${REGISTRY_USER} \
                                --password-stdin

                            echo "Pushing image..."
                            podman push ${params.REGISTRY}/docusaurus:latest

                            echo "Logging out..."
                            podman logout ${params.REGISTRY}
                        """
                    }
                }
            }
        }

        stage('Deploy') {
            when {
                expression { return params.DEPLOY_TO_TARGET == true }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: params.REGISTRY_CREDENTIAL_ID,
                        usernameVariable: 'REGISTRY_USER',
                        passwordVariable: 'REGISTRY_PASS'
                    )]) {
                        sh """
                            ssh ${params.TARGET_HOST} '
                                echo "Logging into registry..."
                                echo ${params.REGISTRY_PASS} | podman login ${params.REGISTRY} \
                                    --username ${params.REGISTRY_USER} \
                                    --password-stdin

                                echo "Pulling latest image..."
                                podman pull ${params.REGISTRY}/docusaurus:latest

                                echo "Stopping old container..."
                                podman stop docusaurus 2>/dev/null || true
                                podman rm docusaurus 2>/dev/null || true

                                echo "Starting new container..."
                                podman run -d --name docusaurus -p 3000:3000 ${params.REGISTRY}/docusaurus:latest

                                echo "Logging out..."
                                podman logout ${params.REGISTRY}

                                echo "Deployment complete!"
                            '
                        """
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // Ensure logout even if pipeline fails
                sh "podman logout ${params.REGISTRY} 2>/dev/null || true"
            }
            deleteDir()
        }
    }
}
