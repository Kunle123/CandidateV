from setuptools import setup, find_packages

setup(
    name="auth_service_v2",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi",
        "sqlalchemy",
        "pydantic",
        "pytest",
        "pytest-cov",
        "pytest-asyncio",
        "alembic",
        "python-jose",
        "passlib",
        "python-multipart",
        "psycopg2-binary",
        "fastapi-mail",
        "PyJWT",
        "jsonschema",
        "python-dotenv",
        "bcrypt",
    ],
    python_requires=">=3.9",
) 