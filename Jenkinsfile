pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = 'dockerhub-credentials'
        SSH_KEY_CREDENTIALS   = 'backend-ssh-key'
        DOCKER_IMAGE          = 'longlephanhai/fcorp-backend'
        BACKEND_EC2_USER      = 'ubuntu'
        BACKEND_EC2_IP        = '10.0.10.66'
    }

    stages {
        stage('Checkout Code') {
            steps {
                echo "Đang kéo mã nguồn mới nhất..."
                checkout scm
            }
        }

        stage('Backend Lint & Test') {
            steps {
                echo "Đang kiểm tra chất lượng mã nguồn..."
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm test -- --passWithNoTests'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Đang đóng gói Docker Image cho NestJS..."
                dir('backend') {
                    sh "docker build -t ${DOCKER_IMAGE}:${BUILD_NUMBER} -t ${DOCKER_IMAGE}:latest ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo "Đang đẩy Docker Image lên Docker Hub..."
                withCredentials([usernamePassword(credentialsId: "${DOCKERHUB_CREDENTIALS}", usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker push ${DOCKER_IMAGE}:${BUILD_NUMBER}"
                    sh "docker push ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Deploy to EC2 Backend') {
            steps {
                echo "Đang triển khai lên EC2 Backend qua mạng nội bộ..."
                sshagent([SSH_KEY_CREDENTIALS]) {
                    sh """
                        scp -o StrictHostKeyChecking=no backend/docker-compose.yml ${BACKEND_EC2_USER}@${BACKEND_EC2_IP}:/app/docker-compose.yml
                        ssh -o StrictHostKeyChecking=no ${BACKEND_EC2_USER}@${BACKEND_EC2_IP} '
                            cd /app
                            export DOCKER_IMAGE=${DOCKER_IMAGE}:${BUILD_NUMBER}
                            docker compose pull
                            docker compose up -d --remove-orphans
                            docker image prune -f
                        '
                    """
                }
            }
        }
    }

    post {
        success {
            echo "Deployment thành công! Phiên bản ${BUILD_NUMBER} đã hoạt động trên EC2."
        }
        failure {
            echo "Deployment thất bại! Hãy kiểm tra log chi tiết ở trên."
        }
    }
}
