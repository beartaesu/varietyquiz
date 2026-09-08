# V1 콘텐츠 이관 도구

작성일: 2026-09-08

## 안전 기본값

이 도구는 기본적으로 보고서만 출력하고 데이터베이스에는 쓰지 않습니다.

```powershell
npm run migrate:v1-content
```

다른 입력 파일은 `--input`으로 지정합니다.

```powershell
npm run migrate:v1-content -- --input=data/migration-samples/v1-content.sample.json
```

보고서를 파일로 보관하려면 `--report`를 추가합니다.

```powershell
npm run migrate:v1-content -- --report=artifacts/migration-report.json
```

검토가 끝난 항목을 실제 DB에 초안으로 저장할 때만 `--apply`를 명시합니다.

```powershell
npm run migrate:v1-content -- --input=검토된-입력.json --report=적용-보고서.json --apply
```

## 입력 규칙

- 입력 최상위 값은 배열입니다.
- 각 항목은 고유 `sourceId`, `sourceKind`, 콘텐츠 유형, 슬러그, 제목, 요약, 본문, 카테고리, 후보를 포함합니다.
- VS는 후보가 정확히 2개여야 합니다.
- 월드컵은 후보가 16개 또는 32개여야 합니다.
- 모든 후보는 권리 상태와 권리 메모를 가져야 합니다.
- 이미지가 있다면 HTTPS 이미지 URL, 대체 텍스트, 출처 URL이 모두 필요합니다.

## 제외 규칙

- `sourceKind: v1-celebrity`는 항상 수동 권리 검토 대상으로 제외합니다.
- 권리 상태가 `unknown`인 후보가 하나라도 있으면 제외합니다.
- 설명 길이, 후보 수, 슬러그 형식 등 DB 기준을 충족하지 못하면 `invalid`로 분류합니다.
- 도구는 외부 이미지를 다운로드하거나 프록시하지 않습니다.

## 재실행과 추적

- 원본 ID에서 결정적인 V2 UUID를 만들기 때문에 같은 입력은 같은 매핑을 생성합니다.
- 적용 성공 시 `migration_source_maps`에 원본 ID, 대상 ID, 체크섬을 기록합니다.
- 같은 원본을 다시 적용하면 중복 생성하지 않고 건너뜁니다.
- 적용 후 원본 내용이 바뀌면 체크섬 불일치로 중단합니다. 기존 행을 자동 덮어쓰지 않습니다.
- 제외·오류 사유와 ID 매핑은 콘솔 및 선택한 보고서 파일에 남습니다.

## 현재 샘플 결과

샘플 3건은 다음처럼 분류됩니다.

| 분류 | 건수 | 의미 |
| --- | ---: | --- |
| ready | 1 | 자체 작성 텍스트 VS, 초안 이관 가능 |
| excluded | 1 | V1 연예인 권리 검토 필요 |
| invalid | 1 | 요약·본문·후보 수 부족 |
