FROM node:22-alpine AS ui-build
WORKDIR /ui
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS api-build
WORKDIR /src
COPY src/AppointmentSlots.Api/AppointmentSlots.Api.csproj src/AppointmentSlots.Api/
RUN dotnet restore src/AppointmentSlots.Api/AppointmentSlots.Api.csproj
COPY src/AppointmentSlots.Api/ src/AppointmentSlots.Api/
RUN dotnet publish src/AppointmentSlots.Api/AppointmentSlots.Api.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
COPY --from=api-build /app/publish .
COPY --from=ui-build /ui/dist ./wwwroot
ENTRYPOINT ["dotnet", "AppointmentSlots.Api.dll"]
