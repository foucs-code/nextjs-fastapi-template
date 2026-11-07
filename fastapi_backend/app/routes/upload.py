import csv
import io

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.models import User
from app.schemas import UploadWordsResponse
from app.users import current_active_user

router = APIRouter(tags=["upload"])

MAX_FILE_SIZE = 5 * 1024 * 1024

ALLOWED_CONTENT_TYPES = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/octet-stream",
}

# ruff: noqa: B008
@router.post("/upload-words", response_model=UploadWordsResponse)
async def upload_words(
    file: UploadFile = File(...),
    user: User = Depends(current_active_user),
) -> UploadWordsResponse:
    """上传 CSV 单词表: 校验,解析,去重,返回统计结果."""
    filename = file.filename or "upload.csv"
    print("success: " + filename)
    if not filename.lower().endswith(".csv"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="只支持.csv 文件",
        )

    if file.content_type and file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"不支持的文件类型:{file.content_type}",
        )

    raw = await file.read(MAX_FILE_SIZE + 1)
    await file.close()

    if not raw:
        raise HTTPException(status_code=400, detail="文件为空")

    if len(raw) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="文件不能超过 5 MB")

    try:
        text = raw.decode("utf-8-sig")
        print("word: " + text)
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400,
            detail="文件必须是 UTF-8 编码",
        ) from exc

    total_rows = 0
    ignored_rows = 0
    words: list[str] = []

    try:
        for row in csv.reader(io.StringIO(text)):
            total_rows += 1

            if not row or not row[0].strip():
                ignored_rows += 1
                continue

            word = row[0].strip()

            # 第一行是表头时跳过：word,meaning,...
            if word.lower() == "word":
                ignored_rows += 1
                continue

            words.append(word)
    except csv.Error as exc:
        raise HTTPException(status_code=400, detail="CSV 解析失败") from exc

    unique_words = list(dict.fromkeys(words))

    if not unique_words:
        raise HTTPException(status_code=400, detail="CSV 中没有可用单词")

    skipped = ignored_rows + (len(words) - len(unique_words))

    return UploadWordsResponse(
        filename=filename,
        total_rows=total_rows,
        valid_words=len(unique_words),
        skipped=skipped,
        preview=unique_words[:10],
    )
