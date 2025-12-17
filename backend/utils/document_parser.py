"""
Document parser for extracting text from various file formats.

This module provides functionality for parsing PDF, DOCX, and TXT files.
Depends on: PyPDF2, python-docx
"""

from typing import Optional
from pathlib import Path
import PyPDF2
from docx import Document

from exceptions import StorageError


class DocumentParser:
    """
    Parses documents and extracts text content.

    This class supports multiple file formats including PDF, DOCX, and TXT.
    """

    @staticmethod
    async def parse_file(file_path: str) -> str:
        """
        Parse a file and extract its text content.

        Args:
            file_path: Path to the file

        Returns:
            str: Extracted text content

        Raises:
            StorageError: If file format is unsupported or parsing fails
        """
        ext = DocumentParser.get_file_extension(Path(file_path).name)

        if ext == '.pdf':
            return await DocumentParser.parse_pdf(file_path)
        elif ext == '.docx':
            return await DocumentParser.parse_docx(file_path)
        elif ext == '.txt':
            return await DocumentParser.parse_txt(file_path)
        else:
            raise StorageError(f"Unsupported file format: {ext}")

    @staticmethod
    async def parse_pdf(file_path: str) -> str:
        """
        Parse a PDF file and extract text.

        Args:
            file_path: Path to the PDF file

        Returns:
            str: Extracted text from all pages

        Raises:
            StorageError: If PDF parsing fails
        """
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except Exception as e:
            raise StorageError(f"Failed to parse PDF file: {str(e)}")

    @staticmethod
    async def parse_docx(file_path: str) -> str:
        """
        Parse a DOCX file and extract text.

        Args:
            file_path: Path to the DOCX file

        Returns:
            str: Extracted text from all paragraphs

        Raises:
            StorageError: If DOCX parsing fails
        """
        try:
            doc = Document(file_path)
            text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            return text
        except Exception as e:
            raise StorageError(f"Failed to parse DOCX file: {str(e)}")

    @staticmethod
    async def parse_txt(file_path: str) -> str:
        """
        Parse a TXT file and read its content.

        Tries multiple encodings: utf-8, windows-1251, cp1252, latin-1.

        Args:
            file_path: Path to the TXT file

        Returns:
            str: File content

        Raises:
            StorageError: If file reading fails with all encodings
        """
        # Try multiple encodings
        encodings = ['utf-8', 'windows-1251', 'cp1252', 'latin-1']

        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    return file.read()
            except (UnicodeDecodeError, LookupError):
                continue
            except Exception as e:
                raise StorageError(f"Failed to read TXT file: {str(e)}")

        # If all encodings failed
        raise StorageError(f"Failed to read TXT file: Could not decode with any of {encodings}")

    @staticmethod
    def get_file_extension(filename: str) -> str:
        """
        Get the file extension from a filename.

        Args:
            filename: Name of the file

        Returns:
            str: File extension (e.g., '.pdf', '.docx')
        """
        return Path(filename).suffix.lower()

    @staticmethod
    def is_supported_format(filename: str) -> bool:
        """
        Check if a file format is supported.

        Args:
            filename: Name of the file

        Returns:
            bool: True if format is supported, False otherwise
        """
        ext = DocumentParser.get_file_extension(filename)
        return ext in {'.pdf', '.docx', '.txt'}
