FOR /D /r %%G in ("*") DO (
    >nul 2>nul dir /a-d "%%G" && (echo Files exist) || (rd %%G)
)
pause