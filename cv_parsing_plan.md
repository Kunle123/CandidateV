# CV Parsing Implementation Plan

## 1. Goal

To implement functionality within the `cv_service` (`backend/cv_service`) that allows it to:
1. Receive an uploaded CV file (PDF, DOCX, TXT) via an API endpoint.
2. Parse the content of the uploaded file to extract text.
3. Create a new CV record in the database using the extracted information.
4. Return the details of the newly created CV record.

This will fix the current issue where the database remains empty because the CV upload mechanism is incomplete.

## 2. Prerequisites & Assumptions

*   The basic CV database schema (`models.py`) and tables exist (confirmed by `da41914`).
*   The CV service application (`main.py`) is running and deployable.
*   The frontend (`cvService.js`) correctly sends the file using `FormData` to a `POST` endpoint on the CV service (currently targets `POST /api/cv`).
*   We will start with basic text extraction and map it primarily to the `summary` field or a new dedicated field in the `CV` model. Full structural parsing (identifying experience, education sections etc.) is complex and considered a future enhancement.

## 3. Implementation Steps

**Target Service:** `backend/cv_service`

**Step 3.1: Modify/Create API Endpoint for File Upload**

*   **File:** `backend/cv_service/app/main.py`
*   **Action:** Decide whether to modify the existing `POST /api/cv` or create a new `POST /api/cv/upload`. Using a dedicated endpoint is often cleaner. For this plan, let's assume we modify `POST /api/cv` for simplicity, but creating `/upload` is a valid alternative.
*   **Change:** Modify the endpoint signature to accept a file upload instead of structured JSON.
    *   Add imports: `from fastapi import File, UploadFile`
    *   Change the `create_cv` function signature:
        ```python
        # Remove or comment out the existing 'cv_data: CVCreate' parameter
        # Add the file parameter
        async def create_cv(
            # cv_data: CVCreate, # REMOVE/COMMENT OUT
            file: UploadFile = File(...), # ADD THIS
            auth: dict = Depends(verify_token),
            db: Session = Depends(get_db_session)
        ):
            # ... (rest of the function needs modification - see below)
        ```

**Step 3.2: Add Parsing Libraries**

*   **File:** `backend/cv_service/requirements.txt`
*   **Action:** Add necessary libraries for file type detection and parsing.
    *   For file type detection: `python-magic-bin; sys_platform == 'win32'` and `python-magic; sys_platform != 'win32'` (Handles different OS)
    *   For PDF parsing: `pypdf` (or `PyPDF2` if preferred)
    *   For DOCX parsing: `python-docx`
*   **Example lines to add to `requirements.txt`:**
    ```
    python-magic-bin; sys_platform == 'win32'
    python-magic; sys_platform != 'win32'
    pypdf
    python-docx
    ```

**Step 3.3: Implement File Reading and Parsing Logic**

*   **File:** `backend/cv_service/app/main.py` (within the modified `create_cv` function)
*   **Action:** Add logic to read the file, detect its type, and parse content.
    *   Import necessary libraries: `import magic`, `io`, `pypdf`, `docx`
    *   Read file content: `content = await file.read()`
    *   Detect MIME type: `mime_type = magic.from_buffer(content, mime=True)`
    *   Implement conditional parsing:
        ```python
        full_text = ""
        try:
            if "pdf" in mime_type:
                reader = pypdf.PdfReader(io.BytesIO(content))
                for page in reader.pages:
                    full_text += page.extract_text() + "\n"
            elif "officedocument.wordprocessingml.document" in mime_type: # DOCX
                document = docx.Document(io.BytesIO(content))
                for para in document.paragraphs:
                    full_text += para.text + "\n"
            elif "text/plain" in mime_type:
                full_text = content.decode('utf-8') # Or try other encodings
            else:
                # Handle unsupported type - maybe try decoding as text as fallback?
                logger.warning(f"Unsupported file type uploaded: {mime_type}. Attempting text decode.")
                try:
                    full_text = content.decode('utf-8')
                except UnicodeDecodeError:
                     logger.error(f"Failed to decode unsupported file type as text.")
                     raise HTTPException(status_code=400, detail=f"Unsupported file type: {mime_type}")

            logger.info(f"Successfully parsed file: {file.filename} (Type: {mime_type})")

        except Exception as e:
            logger.error(f"Failed to parse file {file.filename}. Error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Failed to parse file content: {str(e)}")

        # Ensure full_text is not empty
        if not full_text.strip():
             logger.error(f"Extracted text is empty for file: {file.filename}")
             raise HTTPException(status_code=400, detail="Could not extract text content from the file.")
        ```

**Step 3.4: Map Parsed Data and Save to Database**

*   **File:** `backend/cv_service/app/main.py` (within the modified `create_cv` function, after parsing)
*   **Action:** Create and save the `models.CV` instance using extracted data.
    *   Remove the old logic that used `cv_data: CVCreate`.
    *   Create the `new_cv` object:
        ```python
        user_id = auth["user_id"]
        cv_id = uuid.uuid4() if not is_sqlite else str(uuid.uuid4())
        now = datetime.utcnow()

        # NOTE: Initial simple mapping. All extracted text goes into summary.
        # Consider adding a dedicated 'raw_text' field later.
        # Name defaults to filename initially.
        new_cv = models.CV(
            id=cv_id,
            user_id=user_id,
            name=file.filename or f"Uploaded CV {now.strftime('%Y-%m-%d')}", # Use filename as default name
            description="Uploaded CV",
            is_default=False, # Sensible default for uploads
            version=1,
            template_id="default", # Or derive somehow if needed
            style_options="{}", # Default empty JSON
            personal_info="{}", # Default empty JSON
            summary=full_text.strip(), # Store extracted text here initially
            custom_sections="{}", # Default empty JSON
            last_modified=now,
            created_at=now,
            updated_at=now
        )

        # --- Add logic to handle setting is_default ---
        # If you want the first upload to be default, query existing CVs.
        # existing_cv_count = db.query(models.CV).filter(models.CV.user_id == user_id).count()
        # if existing_cv_count == 0:
        #     new_cv.is_default = True

        # Add to session and commit
        try:
            db.add(new_cv)
            db.commit()
            db.refresh(new_cv)
            logger.info(f"Successfully saved parsed CV to DB. ID: {new_cv.id}")
        except Exception as e:
            db.rollback()
            logger.error(f"Database error saving parsed CV. Error: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to save CV to database.")

        # Return the serialized CV
        return serialize_cv(new_cv) # Ensure serialize_cv handles the new structure
        ```

**Step 3.5: Ensure Serializer Compatibility**

*   **File:** `backend/cv_service/app/main.py`
*   **Action:** Review the `serialize_cv` function to make sure it correctly handles the fields populated during upload (especially if any fields are left empty initially). No changes likely needed if it already handles `None` values gracefully.

## 4. Testing Strategy

*   **Unit Tests:**
    *   Create test functions specifically for parsing logic (pass mock file content, check extracted text). Test with sample PDF, DOCX, TXT files. Test edge cases (empty files, corrupted files, unsupported types).
*   **Integration Tests (FastAPI TestClient):**
    *   Simulate file uploads to the modified endpoint using `TestClient`.
    *   Verify the API response status code (201 Created).
    *   Verify the structure and content of the returned JSON matches the parsed input.
    *   Verify database state: check if a new row exists in the `cvs` table with the correct data.
*   **Manual Frontend Testing:**
    *   Use the frontend upload feature.
    *   Upload different valid file types (PDF, DOCX, TXT).
    *   Confirm success toast message and that the new CV appears in the list.
    *   Check the database manually to confirm data persistence.
    *   Upload unsupported file types and confirm appropriate error handling.
    *   Upload empty or corrupted files.

## 5. Deployment Strategy

1.  Commit all changes to the `backend/cv_service` code (`main.py`, `requirements.txt`) to git.
2.  Push the commit to the remote repository (`origin main`).
3.  Monitor the deployment pipeline for the `cv-service` on Railway.
    *   Check **Build Logs** ensure `pip install` installs the new dependencies successfully.
    *   Check **Deploy Logs** ensure the service starts without errors.
    *   Verify the service passes its **Health Check**.
4.  Perform post-deployment manual testing via the frontend.

## 6. Cleanup (Post-Implementation)

*   Once the implementation is complete, tested, and deployed successfully, delete this `cv_parsing_plan.md` file.
    ```bash
    git rm cv_parsing_plan.md
    git commit -m "Clean up CV parsing implementation plan file"
    git push
    ``` 