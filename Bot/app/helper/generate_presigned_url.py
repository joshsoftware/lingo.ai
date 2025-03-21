import boto3
from botocore.exceptions import NoCredentialsError


AWS_RECORDING_STORAGE_BUCKET_NAME = ""
AWS_ACCESS_KEY_ID = ""
AWS_SECRET_ACCESS_KEY = ""

def generate_presigned_url(file_key, expiration=3600):
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        )
        
        presigned_url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": AWS_RECORDING_STORAGE_BUCKET_NAME, "Key": file_key},
            ExpiresIn=expiration,
        )

        
        return presigned_url

    except NoCredentialsError:
        print("Credentials not available.")
        return None
    
    
def extract_file_url(presigned_url):
    from urllib.parse import urlparse, unquote
    """ Extract the URL up to the file extension and remove 's3://' if present """
    # Decode URL to handle cases like 's3%3A//'
    decoded_url = unquote(presigned_url)

    # Remove query parameters if any
    base_url = decoded_url.split('?')[0]

    # Remove 's3://bucket-name/' pattern if present
    clean_url = base_url.replace(f"s3://{AWS_RECORDING_STORAGE_BUCKET_NAME}/", "")

    return clean_url