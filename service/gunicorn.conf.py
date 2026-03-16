import os

from prometheus_client import multiprocess


def child_exit(server, worker):
    """
    Gunicorn hook to clean up Prometheus multiprocess metrics for dead workers.
    """
    if os.environ.get("PROMETHEUS_MULTIPROC_DIR"):
        multiprocess.mark_process_dead(worker.pid)

