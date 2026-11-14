.PHONY: eval test backend frontend

eval:
	python scripts/eval_all.py

test:
	python -m pytest backend/tests -v

backend:
	python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

frontend:
	cd frontend && npm run dev
