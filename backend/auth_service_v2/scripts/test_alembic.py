"""Test Alembic configuration."""
import os
import sys
import subprocess
from pathlib import Path

def test_alembic_config():
    print("Testing Alembic Configuration:")
    
    # Check for alembic.ini
    if not Path("alembic.ini").exists():
        print("ERROR: alembic.ini not found")
        return False
    print("✓ alembic.ini found")
    
    # Check for alembic directory
    if not Path("alembic").is_dir():
        print("ERROR: alembic directory not found")
        return False
    print("✓ alembic directory found")
    
    # Check for env.py
    if not Path("alembic/env.py").exists():
        print("ERROR: alembic/env.py not found")
        return False
    print("✓ env.py found")
    
    # Check for versions directory
    versions_dir = Path("alembic/versions")
    if not versions_dir.is_dir():
        print("ERROR: alembic/versions directory not found")
        return False
    print("✓ versions directory found")
    
    # Check if versions directory has migration files
    migration_files = list(versions_dir.glob("*.py"))
    if not migration_files:
        print("WARNING: No migration files found in alembic/versions")
    else:
        print(f"✓ Found {len(migration_files)} migration files")
        for file in migration_files:
            print(f"  - {file.name}")
    
    # Try to run alembic current
    try:
        print("\nRunning 'alembic current'...")
        result = subprocess.run(
            ["alembic", "current"],
            capture_output=True,
            text=True,
            check=False
        )
        
        if result.returncode == 0:
            print(f"✓ Current revision: {result.stdout.strip()}")
        else:
            print(f"ERROR: alembic current failed:\n{result.stderr.strip()}")
            return False
            
        # Check for multiple heads
        print("\nChecking for multiple heads...")
        heads_result = subprocess.run(
            ["alembic", "heads"],
            capture_output=True,
            text=True,
            check=False
        )
        
        if heads_result.returncode == 0:
            heads = [h for h in heads_result.stdout.strip().split('\n') if h]
            if len(heads) > 1:
                print(f"WARNING: Multiple heads found: {', '.join(heads)}")
            else:
                print("✓ Single head found")
        else:
            print(f"ERROR: Could not check for multiple heads:\n{heads_result.stderr.strip()}")
            
    except Exception as e:
        print(f"ERROR: Failed to run alembic: {str(e)}")
        return False
    
    print("\nSUCCESS: Alembic configuration appears valid")
    return True

if __name__ == "__main__":
    success = test_alembic_config()
    sys.exit(0 if success else 1) 