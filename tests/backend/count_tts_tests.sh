#!/bin/bash
# Script to count TTS tests by file and category

echo "=== TTS Test Coverage Report ==="
echo ""

echo "Test Files and Line Counts:"
echo "----------------------------"
find . -name "test_tts*.py" -type f | while read file; do
    lines=$(wc -l < "$file")
    tests=$(grep -c "def test_" "$file")
    printf "%-40s: %4d lines, %3d tests\n" "$file" "$lines" "$tests"
done
echo ""

echo "Total Summary:"
echo "----------------------------"
total_lines=$(find . -name "test_tts*.py" -type f -exec cat {} \; | wc -l)
total_tests=$(find . -name "test_tts*.py" -type f -exec grep -h "def test_" {} \; | wc -l)
echo "Total Lines: $total_lines"
echo "Total Tests: $total_tests"
echo ""

echo "Test Markers:"
echo "----------------------------"
unit_tests=$(find . -name "test_tts*.py" -exec grep -h "@pytest.mark.unit" {} \; | wc -l)
integration_tests=$(find . -name "test_tts*.py" -exec grep -h "@pytest.mark.integration" {} \; | wc -l)
e2e_tests=$(find . -name "test_tts*.py" -exec grep -h "@pytest.mark.e2e" {} \; | wc -l)
slow_tests=$(find . -name "test_tts*.py" -exec grep -h "@pytest.mark.slow" {} \; | wc -l)

echo "Unit tests (@pytest.mark.unit): $unit_tests"
echo "Integration tests (@pytest.mark.integration): $integration_tests"
echo "E2E tests (@pytest.mark.e2e): $e2e_tests"
echo "Slow tests (@pytest.mark.slow): $slow_tests"
echo ""

echo "Test Classes:"
echo "----------------------------"
test_classes=$(find . -name "test_tts*.py" -exec grep -h "^class Test" {} \; | wc -l)
echo "Total Test Classes: $test_classes"
echo ""

echo "Detailed Class List:"
find . -name "test_tts*.py" -type f | while read file; do
    classes=$(grep -c "^class Test" "$file")
    if [ "$classes" -gt 0 ]; then
        echo "  $(basename $file):"
        grep "^class Test" "$file" | sed 's/class /    - /g' | sed 's/:.*//'
    fi
done
