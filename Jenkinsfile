pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        REGISTRY = 'your-registry.example.com'
        TARGET_HOST = 'docusaurus-server'
        IMAGE_NAME = 'docusaurus'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                sh 'git submodule update --init --recursive --remote'
            }
        }

        stage('Build') {
            steps {
                sh """
                    podman build -t ${REGISTRY}/${IMAGE_NAME}:latest -f Dockerfile.prod .
                    podman push ${REGISTRY}/${IMAGE_NAME}:latest
                """
            }
        }

        stage('Deploy') {
            steps {
                sh """
                    ssh ${TARGET_HOST} "
                        podman pull ${REGISTRY}/${IMAGE_NAME}:latest &&
                        podman stop ${IMAGE_NAME} 2>/dev/null || true &&
                        podman rm ${IMAGE_NAME} 2>/dev/null || true &&
                        podman run -d \
                            --name ${IMAGE_NAME} \
                            -p 3000:3000 \
                            ${REGISTRY}/${IMAGE_NAME}:latest
                    "
                """
            }
        }
    }
}
