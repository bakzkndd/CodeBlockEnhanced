FOR /D /r %%G in ("*") DO (
    cd "%%G"
    FOR %%H IN (*) DO (
        Echo "%%H"|findstr /R ".*-original.svg"
        If errorlevel 0 if not errorlevel 1 echo valid
        If errorlevel 1 if not errorlevel 2 Del %%H
        If errorlevel 2 if not errorlevel 3 echo wrong syntax
    )
    cd ..
)
pause
