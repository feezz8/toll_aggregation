from setuptools import setup

setup(
    name="se2460",
    version="1.0",
    py_modules=["cli_diodia"],
    install_requires=[
        "typer",
        "rich",
        "requests"
    ],
    entry_points={
        "console_scripts": [
            "se2460 = cli_diodia:app"
        ]
    },
)
