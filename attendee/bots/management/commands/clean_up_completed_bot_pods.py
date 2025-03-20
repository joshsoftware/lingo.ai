import logging
from typing import List

from django.core.management.base import BaseCommand
from kubernetes import client, config

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Cleans up completed bot pods"

    def __init__(self):
        super().__init__()
        # Initialize kubernetes client
        try:
            config.load_incluster_config()
        except config.ConfigException:
            config.load_kube_config()
        self.v1 = client.CoreV1Api()
        self.namespace = "attendee"
        logger.info("initialized kubernetes client")

    def handle(self, *args, **options):
        logger.info("Cleaning up completed bot pods...")

        try:
            # Get all pods in the namespace
            pods = self.v1.list_namespaced_pod(namespace=self.namespace)

            # Filter for completed bot pods
            completed_pods: List[str] = [pod.metadata.name for pod in pods.items if (pod.metadata.name.startswith("bot-pod-") and pod.status.phase == "Succeeded")]

            # Delete each completed pod
            for pod_name in completed_pods:
                try:
                    self.v1.delete_namespaced_pod(name=pod_name, namespace=self.namespace, grace_period_seconds=60)
                    logger.info(f"Deleted pod: {pod_name}")
                except client.ApiException as e:
                    logger.info(f"Error deleting pod {pod_name}: {str(e)}")

            logger.info(f"Bot pod cleanup completed. Deleted {len(completed_pods)} pods")

        except client.ApiException as e:
            logger.info(f"Failed to cleanup bot pods: {str(e)}")
