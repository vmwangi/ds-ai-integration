DukaLink workshop files: From Brief to Production
Set these up BEFORE the event.

dukalink_customers.csv    5,150 retailer accounts. Deliberate PII columns
                          (phone_number, national_id) and planted messiness:
                          nulls, 120 duplicate rows, 30 conflicting duplicate
                          IDs, and a few legitimate whale accounts with
                          average orders above KES 200,000.
dukalink_orders.csv       76,503 orders over 12 months, including payment
                          methods. Customer aggregates in the customers file
                          are derived from this table, so joins reconcile.
colab_starter.ipynb       Task 3 starter notebook: pseudonymization and prompt
                          context. Open in Colab and run the cell first.
                          Hashed data is still personal data; the prompt rule
                          applies after hashing too.
prompts/eda_prompt.txt    Task 3: a workplace-grade EDA prompt to adapt.
prompts/etl_spec_prompt.txt  Task 5: a workplace-grade ETL specification
                          prompt to adapt.
baseline_model.ipynb      Task 4: provided churn model. Run as-is; your work
                          is the interpretation.
flawed_snippet.py         Task 2: the first test case for your Code Review Gem.
slow_pipeline.py          Task 6: correct output, about 100 seconds of runtime.
                          Do not study it before betting on the bottleneck.

Upload the two CSVs to Colab for Milestone 2, and open this whole folder in
VS Code (or your agentic CLI) for Milestone 3.
