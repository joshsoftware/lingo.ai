"""
Migration script to add new columns to api_error_logs table
Run this once to update the existing table schema
"""
from banking.database import engine
from sqlalchemy import text
from logger import logger

def migrate_error_logs_table():
    """Add new columns to api_error_logs table if they don't exist"""
    try:
        # Use begin() to ensure transactions are committed
        with engine.begin() as conn:
            # Check if table exists
            result = conn.execute(text("""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'api_error_logs'
                );
            """))
            table_exists = result.scalar()
            
            if not table_exists:
                logger.info("Table api_error_logs does not exist. It will be created by SQLAlchemy.")
                return
            
            # List of new columns to add (column_name, column_type, default_clause)
            new_columns = [
                ("audio_storage_path", "VARCHAR(500)", ""),
                ("http_method", "VARCHAR(10)", "NOT NULL DEFAULT 'UNKNOWN'"),
                ("request_headers", "JSONB", ""),
                ("request_body", "JSONB", ""),
                ("request_query_params", "JSONB", ""),
                ("request_form_data", "JSONB", ""),
                ("response_status_code", "INTEGER", ""),
                ("response_body", "TEXT", ""),
                ("preprocessing_steps", "JSONB", ""),
                ("preprocessing_logs_text", "TEXT", ""),
                ("execution_time_ms", "DOUBLE PRECISION", ""),
                ("attachment_metadata", "JSONB", ""),
                ("attachment_storage_url", "VARCHAR(500)", ""),
                ("user_id", "VARCHAR(255)", ""),
                ("ip_address", "VARCHAR(45)", ""),
                ("correlation_id", "VARCHAR(255)", ""),
            ]
            
            # Add indexes for new columns
            indexes = [
                ("ix_api_error_logs_http_method", "http_method"),
                ("ix_api_error_logs_response_status_code", "response_status_code"),
                ("ix_api_error_logs_user_id", "user_id"),
                ("ix_api_error_logs_ip_address", "ip_address"),
                ("ix_api_error_logs_correlation_id", "correlation_id"),
            ]
            
            # Add columns that don't exist
            for column_name, column_type, default in new_columns:
                try:
                    # Check if column exists
                    check_result = conn.execute(text(f"""
                        SELECT EXISTS (
                            SELECT FROM information_schema.columns 
                            WHERE table_name = 'api_error_logs' 
                            AND column_name = '{column_name}'
                        );
                    """))
                    column_exists = check_result.scalar()
                    
                    if not column_exists:
                        logger.info(f"Adding column: {column_name}")
                        if default and default.strip():
                            conn.execute(text(f"""
                                ALTER TABLE api_error_logs 
                                ADD COLUMN {column_name} {column_type} {default};
                            """))
                        else:
                            conn.execute(text(f"""
                                ALTER TABLE api_error_logs 
                                ADD COLUMN {column_name} {column_type};
                            """))
                        logger.info(f"Successfully added column: {column_name}")
                    else:
                        logger.info(f"Column {column_name} already exists")
                except Exception as e:
                    logger.error(f"Error adding column {column_name}: {e}")
                    # Don't rollback - continue with other columns
            
            # Add indexes that don't exist
            for index_name, column_name in indexes:
                try:
                    # Check if index exists
                    check_result = conn.execute(text(f"""
                        SELECT EXISTS (
                            SELECT FROM pg_indexes 
                            WHERE indexname = '{index_name}'
                        );
                    """))
                    index_exists = check_result.scalar()
                    
                    if not index_exists:
                        logger.info(f"Adding index: {index_name}")
                        conn.execute(text(f"""
                            CREATE INDEX {index_name} 
                            ON api_error_logs ({column_name});
                        """))
                        logger.info(f"Successfully added index: {index_name}")
                    else:
                        logger.info(f"Index {index_name} already exists")
                except Exception as e:
                    logger.error(f"Error adding index {index_name}: {e}")
                    conn.rollback()
            
            # Make failure_stage nullable if it's not already
            try:
                conn.execute(text("""
                    ALTER TABLE api_error_logs 
                    ALTER COLUMN failure_stage DROP NOT NULL;
                """))
                logger.info("Made failure_stage nullable")
            except Exception as e:
                logger.warning(f"Could not make failure_stage nullable (might already be nullable): {e}")
            
            logger.info("Migration completed successfully")
            
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise

if __name__ == "__main__":
    migrate_error_logs_table()
